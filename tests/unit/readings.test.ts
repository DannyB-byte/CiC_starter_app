import { describe, expect, it } from 'vitest';
import { parseTemperature, displayTemperature, isReadingList } from '../../src/domain/readings';

describe('temperature data integrity', () => {
  it.each(['-12.345', '0', '29', '46', '123.456', '1e3'])('accepts %s without clinical limits', raw => {
    expect(parseTemperature(raw)).toBe(Number(raw));
  });
  it.each(['', ' ', 'NaN', 'Infinity', '1e999', '0x10', 'abc', '36.8C'])('rejects %s', raw => {
    expect(parseTemperature(raw)).toBeNull();
  });
  it('does not round decimal readings', () => {
    expect(displayTemperature(36.875)).toBe('36.875');
    expect(displayTemperature(37)).toBe('37.0');
  });
  it('accepts existing records and rejects nonfinite values', () => {
    const record = { id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: -12.345, note: '' };
    expect(isReadingList([record])).toBe(true);
    expect(isReadingList([{ ...record, temperature: Infinity }])).toBe(false);
    expect(isReadingList([{ ...record, temperature: '37' }])).toBe(false);
  });
});
