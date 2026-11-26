import { STORAGE_KEY } from '../domain/readings';
import type { Reading } from '../domain/readings';
import { listEntries } from './trackerStore';
import type { Entry } from './trackerStore';
import { patientTransaction, validReading, validEntry } from './patientDatabase';

export type LegacySnapshot = { readings: Reading[]; entries: Entry[] };
export const MIGRATION_KEY = 'legacy-import-v1';

export function validateLegacySnapshot(readings: unknown, entries: unknown): LegacySnapshot {
  if (!Array.isArray(readings) || !readings.every(validReading) ||
      !Array.isArray(entries) || !entries.every(validEntry)) {
    throw new Error('Invalid legacy records. Original storage retained.');
  }
  if (new Set(readings.map(row => row.id)).size !== readings.length ||
      new Set(entries.map(row => row.id)).size !== entries.length) {
    throw new Error('Duplicate legacy record identifiers. Original storage retained.');
  }
  return { readings, entries };
}

// Call only during a coordinated cutover with all legacy writers stopped.
// This is deliberately not connected to application startup yet.
export async function readLegacySnapshot(): Promise<LegacySnapshot> {
  const raw = localStorage.getItem(STORAGE_KEY);
  const readings: unknown = raw === null ? [] : JSON.parse(raw);
  const entries = await listEntries();
  if (localStorage.getItem(STORAGE_KEY) !== raw) {
    throw new Error('Legacy readings changed during snapshot. Retry after stopping writers.');
  }
  return validateLegacySnapshot(readings, entries);
}

// All records and the completion marker commit together, or none do.
// add() deliberately rejects collisions instead of overwriting patient data.
export async function importLegacySnapshot(snapshot: LegacySnapshot): Promise<void> {
  const checked = validateLegacySnapshot(snapshot.readings, snapshot.entries);
  await patientTransaction(['readings', 'entries', 'metadata'], 'readwrite', tx => {
    for (const row of checked.readings) tx.objectStore('readings').add(row);
    for (const row of checked.entries) tx.objectStore('entries').add(row);
    return tx.objectStore('metadata').add({ key: MIGRATION_KEY,
      readings: checked.readings.length, entries: checked.entries.length });
  });
}
