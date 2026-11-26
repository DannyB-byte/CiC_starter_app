import { describe, expect, it } from 'vitest';
import { loadReadings, saveReadings } from '../../src/domain/readingRepository';
import { STORAGE_KEY } from '../../src/domain/readings';

const reading = { id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: -12.345, note: 'original' };
function memory(initial: string | null = null) {
  let raw = initial;
  return { getItem: (key: string) => { expect(key).toBe(STORAGE_KEY); return raw; }, setItem: (key: string, value: string) => { expect(key).toBe(STORAGE_KEY); raw = value; } };
}
describe('reading repository', () => {
  it('opens missing storage without writing', () => expect(loadReadings(memory())).toEqual({ readings: [], raw: null }));
  it('round trips existing records without rounding', () => {
    const storage = memory();
    const saved = saveReadings(storage, [reading], null);
    expect(loadReadings(storage)).toEqual(saved);
    expect(saved.readings).toEqual([reading]);
  });
  it.each(['', '{', 'null', '{}', '[{}]'])('preserves malformed data %s', raw => {
    const storage = memory(raw);
    expect(() => loadReadings(storage)).toThrow();
    expect(() => saveReadings(storage, [], raw)).toThrow();
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it('rejects invalid writes', () => {
    const storage = memory();
    expect(() => saveReadings(storage, [{ ...reading, temperature: Infinity }], null)).toThrow();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('rejects a stale snapshot without overwriting', () => {
    const storage = memory();
    saveReadings(storage, [reading], null);
    expect(() => saveReadings(storage, [], null)).toThrow(/changed/);
    expect(loadReadings(storage).readings).toEqual([reading]);
  });
  it('propagates read errors', () => {
    expect(() => loadReadings({ ...memory(), getItem: () => { throw new Error('blocked'); } })).toThrow('blocked');
  });
  it('allows retry after a failed write', () => {
    const storage = memory();
    expect(() => saveReadings({ ...storage, setItem: () => { throw new Error('quota'); } }, [reading], null)).toThrow('quota');
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(saveReadings(storage, [reading], null).readings).toEqual([reading]);
  });
});
