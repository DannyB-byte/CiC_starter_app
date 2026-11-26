import { readEntries, changeEntry } from './patientStore';
export type Entry = { id: string; kind: string; date: string; values: Record<string,string> };
export const listEntries = readEntries;
export const saveEntry = (entry: Entry, base: Entry | null) => changeEntry(entry.id, entry, base);
export const deleteEntry = (entry: Entry) => changeEntry(entry.id, null, entry);
