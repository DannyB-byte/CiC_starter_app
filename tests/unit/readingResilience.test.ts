import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyChange, loadReadings, mutateReadings } from '../../src/domain/readingRepository';
import { createId, displayTemperature, formatDate, formatTime, isReadingList, parseTemperature, todayString } from '../../src/domain/readings';
const base = { id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: 36.875, note: '' };
const values = { date: base.date, temperature: base.temperature, note: '' };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('domain edge cases', () => {
  it.each([null, {}, [null], [1], [{ ...base, id: 1 }], [{ ...base, date: 1 }], [{ ...base, recordedAt: 1 }], [{ ...base, note: 1 }]])('rejects invalid structure %#', value => expect(isReadingList(value)).toBe(false));
  it.each(['date', 'recordedAt', 'temperature', 'note'] as const)('rejects conflicting %s', field => {
    const changed = { ...base, [field]: field === 'temperature' ? 1 : 'changed' };
    expect(() => applyChange([changed], { kind: 'edit', base, values })).toThrow(/changed/);
  });
  it('formats dates and times and uses local calendar date', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2024, 1, 29, 12));
    expect(todayString()).toBe('2024-02-29');
    expect(formatDate('2024-02-29')).toBe(new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(2024, 1, 29, 12)));
    expect(formatTime(base.recordedAt)).toBe(new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(base.recordedAt)));
  });
  it('generates IDs with and without randomUUID', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid' }); expect(createId()).toBe('uuid');
    vi.stubGlobal('crypto', {}); expect(createId()).toMatch(/^\d+-/);
    vi.stubGlobal('crypto', undefined); expect(createId()).toMatch(/^\d+-/);
  });
  it('retains large finite values and exponent notation', () => {
    expect(parseTemperature('  +.125e2  ')).toBe(12.5);
    expect(displayTemperature(1e21)).toBe('1e+21');
    expect(parseTemperature(String(Number.MAX_VALUE))).toBe(Number.MAX_VALUE);
  });
});
describe('coordinated storage', () => {
  it('rejects writes without Web Locks', async () => {
    vi.stubGlobal('navigator', {});
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    await expect(mutateReadings(storage, { kind: 'create', values })).rejects.toThrow(/coordinated/);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('serialises 40 queued mutations with a deterministic lock double', async () => {
    let tail = Promise.resolve();
    vi.stubGlobal('navigator', { locks: { request: (_name: string, callback: () => unknown) => {
      const next = tail.then(callback); tail = next.then(() => undefined, () => undefined); return next;
    } } });
    let raw: string | null = null;
    const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
    await Promise.all(Array.from({ length: 40 }, (_, i) => mutateReadings(storage, { kind: 'create', values: { ...values, note: String(i) } })));
    const records = loadReadings(storage).readings;
    expect(records).toHaveLength(40);
    expect(new Set(records.map(r => r.id)).size).toBe(40);
  });
});
