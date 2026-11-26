export type Reading = {
  id: string;
  date: string;
  recordedAt: string;
  temperature: number;
  note: string;
};

export type ReadingDraft = Pick<Reading, 'date' | 'note'> & { temperature: string };

export const STORAGE_KEY = 'chemo-in-comfort.readings.v1';

export function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

export function isReadingList(value: unknown): value is Reading[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item === 'object' && item !== null &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.recordedAt === 'string' &&
    typeof item.temperature === 'number' && Number.isFinite(item.temperature) &&
    typeof item.note === 'string'
  );
}

export function parseTemperature(raw: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function displayTemperature(value: number): string {
  return Number.isInteger(value) && Math.abs(value) < 1e21 ? value.toFixed(1) : String(value);
}
