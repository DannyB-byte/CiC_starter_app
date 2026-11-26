import { openPatientDatabase, validReading, validEntry } from './patientDatabase';
import { MIGRATION_KEY, readLegacySnapshot, validateLegacySnapshot } from './legacyMigration';
import type { LegacySnapshot } from './legacyMigration';
import { applyChange } from '../domain/readingRepository';
import type { ReadingChange } from '../domain/readingRepository';
import type { Reading } from '../domain/readings';
import type { Entry } from './trackerStore';

type Store = 'readings' | 'entries' | 'metadata';
// All callbacks run in IndexedDB request events, keeping the transaction active.
async function transact<T>(stores: Store[], mode: IDBTransactionMode, work: (tx: IDBTransaction, done: (value: T) => void, fail: (error: unknown) => void) => void): Promise<T> {
  const db = await openPatientDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let result: T;
      let failure: unknown;
      const fail = (error: unknown) => { failure = error; tx.abort(); };
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Storage transaction aborted.'));
      tx.oncomplete = () => resolve(result);
      try { work(tx, value => { result = value; }, fail); } catch (error) { fail(error); }
    });
  } finally { db.close(); }
}
export function notifyPatientChange() {
  window.dispatchEvent(new Event('cic-records-restored'));
  const channel = new BroadcastChannel('cic-patient-changes');
  try { channel.postMessage('changed'); } finally { channel.close(); }
}
let startup: Promise<void> | undefined;
export function ensurePatientStorage(): Promise<void> {
  if (!startup) startup = initialize().catch(error => { startup = undefined; throw error; });
  return startup;
}
async function initialize() {
  const migrated = await transact<boolean>(['metadata'], 'readonly', (tx, done) => {
    const request = tx.objectStore('metadata').get(MIGRATION_KEY);
    request.onsuccess = () => done(request.result !== undefined);
  });
  if (migrated) return;
  if (!navigator.locks) throw new Error('Safe migration requires a supported browser.');
  await navigator.locks.request('chemo-in-comfort.readings.v1', async () => {
    const snapshot = await readLegacySnapshot();
    await transact<void>(['readings','entries','metadata'], 'readwrite', (tx, done, fail) => {
      const marker = tx.objectStore('metadata').get(MIGRATION_KEY);
      marker.onsuccess = () => {
        try {
          if (!marker.result) {
            for (const row of snapshot.readings) tx.objectStore('readings').add(row);
            for (const row of snapshot.entries) tx.objectStore('entries').add(row);
            tx.objectStore('metadata').add({key:MIGRATION_KEY, readings:snapshot.readings.length, entries:snapshot.entries.length});
          }
          done(undefined);
        } catch (error) { fail(error); }
      };
    });
  });
}
export async function patientSnapshot(): Promise<LegacySnapshot> {
  await ensurePatientStorage();
  return transact(['readings','entries'], 'readonly', (tx, done, fail) => {
    const readings = tx.objectStore('readings').getAll();
    const entries = tx.objectStore('entries').getAll();
    entries.onsuccess = () => { try { done(validateLegacySnapshot(readings.result, entries.result)); } catch (error) { fail(error); } };
  });
}
export async function listReadings(): Promise<Reading[]> {
  await ensurePatientStorage();
  return transact(['readings'], 'readonly', (tx, done, fail) => {
    const request = tx.objectStore('readings').getAll();
    request.onsuccess = () => { if (!request.result.every(validReading)) fail(new Error('Invalid saved readings.')); else done(request.result); };
  });
}
export async function changeReading(change: ReadingChange): Promise<void> {
  await ensurePatientStorage();
  await transact<void>(['readings'], 'readwrite', (tx, done, fail) => {
    const store = tx.objectStore('readings');
    const request = store.get(change.kind === 'create' ? '' : change.base.id);
    request.onsuccess = () => {
      try {
        const next = applyChange(request.result ? [request.result] : [], change);
        if (change.kind === 'delete') store.delete(change.base.id);
        else { if (!validReading(next[0])) throw new Error('Invalid reading.'); if (change.kind === 'create') store.add(next[0]); else store.put(next[0]); }
        done(undefined);
      } catch (error) { fail(error); }
    };
  });
  notifyPatientChange();
}
export async function readEntries(): Promise<Entry[]> {
  await ensurePatientStorage();
  return transact(['entries'], 'readonly', (tx, done, fail) => {
    const request = tx.objectStore('entries').getAll();
    request.onsuccess = () => { if (!request.result.every(validEntry)) fail(new Error('Invalid saved entries.')); else done(request.result); };
  });
}
export async function changeEntry(id: string, next: Entry | null, base: Entry | null): Promise<void> {
  if (next && (!validEntry(next) || next.id !== id)) throw new Error('Invalid entry.');
  await ensurePatientStorage();
  await transact<void>(['entries'], 'readwrite', (tx, done, fail) => {
    const store = tx.objectStore('entries');
    const request = store.get(id);
    request.onsuccess = () => {
      try {
        if (JSON.stringify(request.result ?? null) !== JSON.stringify(base)) throw new Error('Entry changed. Reload before retrying.');
        if (!next) store.delete(id); else if (base) store.put(next); else store.add(next);
        done(undefined);
      } catch (error) { fail(error); }
    };
  });
  notifyPatientChange();
}
export async function mergePatientSnapshot(snapshot: LegacySnapshot): Promise<void> {
  const checked = validateLegacySnapshot(snapshot.readings, snapshot.entries);
  await ensurePatientStorage();
  await transact<void>(['readings','entries'], 'readwrite', (tx, done, fail) => {
    for (const [name, rows] of [['readings',checked.readings],['entries',checked.entries]] as const) {
      const store = tx.objectStore(name);
      for (const row of rows) {
        const request = store.getKey(row.id);
        request.onsuccess = () => { try { if (request.result === undefined) store.add(row); } catch (error) { fail(error); } };
      }
    }
    done(undefined);
  });
  notifyPatientChange();
}

export type PatientPageToken = { key: IDBValidKey; id: IDBValidKey };
export type PatientPage<T> = { rows: T[]; next: PatientPageToken | null };
async function indexedPage<T>(store: 'readings' | 'entries', index: string, valid: (value: unknown) => value is T, limit: number, after: PatientPageToken | null, range?: IDBKeyRange): Promise<PatientPage<T>> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Invalid page size.');
  await ensurePatientStorage();
  return transact([store], 'readonly', (tx, done, fail) => {
    const rows: T[] = [];
    let next: PatientPageToken | null = null;
    const request = tx.objectStore(store).index(index).openCursor(range, 'prev');
    request.onsuccess = () => {
      try {
        const cursor = request.result;
        if (!cursor) { done({ rows, next: null }); return; }
        if (after) {
          const order = indexedDB.cmp(cursor.key, after.key);
          if (order > 0 || (order === 0 && indexedDB.cmp(cursor.primaryKey, after.id) >= 0)) { cursor.continue(); return; }
        }
        if (rows.length === limit) { done({ rows, next }); return; }
        if (!valid(cursor.value)) throw new Error('Invalid saved record.');
        rows.push(cursor.value);
        next = { key: cursor.key, id: cursor.primaryKey };
        cursor.continue();
      } catch (error) { fail(error); }
    };
  });
}
export const pageReadings = (limit = 100, after: PatientPageToken | null = null) => indexedPage('readings', 'date', validReading, limit, after);
export const pageEntries = (kind: string, limit = 100, after: PatientPageToken | null = null) => indexedPage('entries', 'kindDate', validEntry, limit, after, IDBKeyRange.bound([kind, '0001-01-01'], [kind, '9999-12-31']));
