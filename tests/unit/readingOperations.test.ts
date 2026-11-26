import { describe, expect, it } from 'vitest';
import { applyChange } from '../../src/domain/readingRepository';
const base = { id: 'a', date: '2026-11-26', recordedAt: '2026-11-26T12:00:00Z', temperature: 36.8, note: '' };
const values = { date: base.date, temperature: -12.345, note: 'changed' };
describe('reading operations', () => {
  it('appends to latest records', () => expect(applyChange([base], { kind: 'create', values }, () => 'b', () => base.recordedAt)).toEqual([base, { ...values, id: 'b', recordedAt: base.recordedAt }]));
  it('rejects duplicate generated IDs', () => expect(() => applyChange([base], { kind: 'create', values }, () => 'a')).toThrow());
  it('rejects duplicate stored IDs', () => expect(() => applyChange([base, base], { kind: 'delete', base })).toThrow());
  it('preserves original timestamp when editing', () => expect(applyChange([base], { kind: 'edit', base, values })).toEqual([{ ...base, ...values }]));
  it('deletes only the intended record', () => expect(applyChange([base, { ...base, id: 'b' }], { kind: 'delete', base })).toEqual([{ ...base, id: 'b' }]));
  it('rejects stale edits', () => expect(() => applyChange([{ ...base, note: 'new' }], { kind: 'edit', base, values })).toThrow(/changed/));
  it('rejects stale deletions', () => expect(() => applyChange([{ ...base, note: 'new' }], { kind: 'delete', base })).toThrow(/changed/));
  it('rejects editing deleted records', () => expect(() => applyChange([], { kind: 'edit', base, values })).toThrow(/changed/));
});
