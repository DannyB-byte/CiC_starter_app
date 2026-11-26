import { isReadingList, STORAGE_KEY } from './readings';
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
