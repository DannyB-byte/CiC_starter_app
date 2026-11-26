import { isReadingList, isCalendarDate } from '../domain/readings';
import type { Reading } from '../domain/readings';
import type { Entry } from './trackerStore';

export const PATIENT_DB = 'cic-patient-v1';
export function validReading(value: unknown): value is Reading {
  return isReadingList([value]) && (value as Reading).id.length > 0;
}
export function validEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Entry>;
  return typeof row.id === 'string' && row.id.length > 0 &&
    typeof row.kind === 'string' && row.kind.length > 0 &&
    typeof row.date === 'string' && isCalendarDate(row.date) &&
    !!row.values && typeof row.values === 'object' && !Array.isArray(row.values) &&
    Object.values(row.values).every(v => typeof v === 'string');
}

export function openPatientDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PATIENT_DB, 1);
    let abandoned = false;
    request.onblocked = () => { abandoned = true; reject(new Error('Patient database blocked. Close other app windows.')); };
    request.onerror = () => reject(request.error ?? new Error('Patient database unavailable.'));
    request.onupgradeneeded = () => {
      if (abandoned) { request.transaction?.abort(); return; }
      const db = request.result;
      db.createObjectStore('readings', { keyPath: 'id' }).createIndex('date', 'date');
      const entries = db.createObjectStore('entries', { keyPath: 'id' });
      entries.createIndex('date', 'date');
      entries.createIndex('kindDate', ['kind', 'date']);
      db.createObjectStore('metadata', { keyPath: 'key' });
    };
    request.onsuccess = () => {
      const db = request.result;
      if (abandoned) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

// Queue requests synchronously; resolve only after the transaction commits.
export async function patientTransaction<T>(stores: ('readings' | 'entries' | 'metadata')[], mode: IDBTransactionMode, queue: (tx: IDBTransaction) => IDBRequest<T>): Promise<T> {
  const db = await openPatientDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      tx.onabort = () => reject(tx.error ?? new Error('Patient transaction aborted.'));
      try {
        const request = queue(tx);
        tx.oncomplete = () => resolve(request.result);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  } finally { db.close(); }
}
