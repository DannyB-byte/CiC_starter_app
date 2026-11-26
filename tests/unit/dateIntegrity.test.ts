import { describe, expect, it } from 'vitest';
import { isCalendarDate, isRecordedTimestamp, STORAGE_KEY } from '../../src/domain/readings';
import { loadReadings, saveReadings } from '../../src/domain/readingRepository';

describe('date integrity', () => {
  it.each(['2024-02-29', '2026-11-26', '2000-02-29'])('accepts %s', value => expect(isCalendarDate(value)).toBe(true));
  it.each(['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '0000-01-01', '2026-1-01', ''])('rejects %s', value => expect(isCalendarDate(value)).toBe(false));
  it.each(['2026-11-26T12:00:00Z', '2026-11-26T12:00:00.123Z'])('accepts timestamp %s', value => expect(isRecordedTimestamp(value)).toBe(true));
  it.each(['2026-02-30T12:00:00Z', '2026-11-26T24:00:00Z', '2026-11-26T12:60:00Z', 'invalid'])('rejects timestamp %s', value => expect(isRecordedTimestamp(value)).toBe(false));
  it.each([{ date: '2026-02-30' }, { recordedAt: 'invalid' }])('preserves invalid stored record %#', override => {
    const raw = JSON.stringify([{ id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: 37, note: '', ...override }]);
    const storage = { getItem: () => raw, setItem: () => { throw new Error('Unexpected write'); } };
    expect(() => loadReadings(storage)).toThrow(/unexpected format/);
    expect(() => saveReadings(storage, [], raw)).toThrow(/unexpected format/);
    expect(storage.getItem()).toBe(raw);
    expect(STORAGE_KEY).toBe('chemo-in-comfort.readings.v1');
  });
});
