import { createId, isReadingList, STORAGE_KEY } from './readings';
import type { Reading } from './readings';

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export type ReadingSnapshot = { readings: Reading[]; raw: string | null };

export function loadReadings(storage: StoragePort): ReadingSnapshot {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return { readings: [], raw };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Saved readings contain invalid JSON. Original data retained.'); }
  if (!isReadingList(parsed)) throw new Error('Saved readings have an unexpected format. Original data retained.');
  return { readings: parsed, raw };
}

export function saveReadings(storage: StoragePort, next: Reading[], expectedRaw: string | null): ReadingSnapshot {
  if (!isReadingList(next)) throw new Error('Invalid readings cannot be saved.');
  const current = loadReadings(storage);
  if (current.raw !== expectedRaw) throw new Error('Saved readings changed in another window. Reload before saving again.');
  const raw = JSON.stringify(next);
  storage.setItem(STORAGE_KEY, raw);
  return { readings: next, raw };
}

export type ReadingValues = Pick<Reading, 'date' | 'temperature' | 'note'>;
export type ReadingChange = { kind: 'create'; values: ReadingValues } | { kind: 'edit'; base: Reading; values: ReadingValues } | { kind: 'delete'; base: Reading };

export function applyChange(readings: Reading[], change: ReadingChange, idFactory = createId, now = () => new Date().toISOString()): Reading[] {
  if (new Set(readings.map(r => r.id)).size !== readings.length) throw new Error('Duplicate saved reading IDs. Original data retained.');
  if (change.kind === 'create') {
    const id = idFactory();
    if (readings.some(r => r.id === id)) throw new Error('Reading ID already exists. Please retry.');
    return [...readings, { ...change.values, id, recordedAt: now() }];
  }
  const current = readings.find(r => r.id === change.base.id);
  const base = change.base;
  if (!current || current.date !== base.date || current.recordedAt !== base.recordedAt || current.temperature !== base.temperature || current.note !== base.note) {
    throw new Error('This reading changed in another window. Cancel the edit and review the latest reading before retrying.');
  }
  return change.kind === 'delete' ? readings.filter(r => r.id !== base.id) : readings.map(r => r.id === base.id ? { ...r, ...change.values } : r);
}

export async function mutateReadings(storage: StoragePort, change: ReadingChange): Promise<ReadingSnapshot> {
  if (!navigator.locks) throw new Error('This browser does not support safe coordinated diary writes. Use a supported browser.');
  return navigator.locks.request(STORAGE_KEY, () => {
    const snapshot = loadReadings(storage);
    return saveReadings(storage, applyChange(snapshot.readings, change), snapshot.raw);
  });
}
