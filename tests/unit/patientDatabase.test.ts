import { describe, expect, it } from 'vitest';
import { validEntry, validReading } from '../../src/services/patientDatabase';

describe('patient database validation', () => {
  it('accepts finite temperatures without clinical limits', () => {
    const row = { id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: -100, note: '' };
    expect(validReading(row)).toBe(true);
    expect(validReading({ ...row, temperature: Infinity })).toBe(false);
    expect(validReading({ ...row, id: '' })).toBe(false);
    expect(validReading(null)).toBe(false);
  });
  it('checks entry shape and dates', () => {
    const row = { id: 'a', kind: 'food', date: '2026-11-26', values: { Notes: '' } };
    expect(validEntry(row)).toBe(true);
    for (const bad of [null, { ...row, date: '2026-02-30' }, { ...row, values: [] }, { ...row, values: { Notes: 2 } }, { ...row, id: '' }]) expect(validEntry(bad)).toBe(false);
  });
});
