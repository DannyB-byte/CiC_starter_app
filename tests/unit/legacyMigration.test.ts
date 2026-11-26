import { describe, expect, it } from 'vitest';
import { validateLegacySnapshot } from '../../src/services/legacyMigration';

const reading = { id: 'r1', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: -1.25, note: '' };
const entry = { id: 'e1', kind: 'food', date: '2026-11-26', values: { note: 'test' } };

describe('legacy snapshot validation', () => {
  it('accepts empty storage', () => expect(validateLegacySnapshot([], [])).toEqual({ readings: [], entries: [] }));
  it('preserves valid records without rounding', () => expect(validateLegacySnapshot([reading], [entry])).toEqual({ readings: [reading], entries: [entry] }));
  it('rejects malformed records', () => {
    expect(() => validateLegacySnapshot([{ ...reading, temperature: Infinity }], [])).toThrow();
    expect(() => validateLegacySnapshot([], [{ ...entry, values: { note: 1 } }])).toThrow();
  });
  it('rejects duplicate identifiers within each store', () => {
    expect(() => validateLegacySnapshot([reading, reading], [])).toThrow();
    expect(() => validateLegacySnapshot([], [entry, entry])).toThrow();
  });
});
