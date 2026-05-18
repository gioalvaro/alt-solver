import { describe, it, expect } from 'vitest';
import { isValidA1, parseA1, isRangeA1, isCellA1, qualifyWithSheet } from '../../src/shared/a1';

describe('a1', () => {
  describe('isValidA1', () => {
    it('accepts cell refs', () => {
      expect(isValidA1('A1')).toBe(true);
      expect(isValidA1('$A$1')).toBe(true);
      expect(isValidA1('Sheet1!A1')).toBe(true);
      expect(isValidA1("'My Sheet'!$A$1")).toBe(true);
    });

    it('accepts range refs', () => {
      expect(isValidA1('B3:B7')).toBe(true);
      expect(isValidA1('$B$3:$B$7')).toBe(true);
      expect(isValidA1('Sheet1!B3:B7')).toBe(true);
    });

    it('rejects garbage', () => {
      expect(isValidA1('')).toBe(false);
      expect(isValidA1('1A')).toBe(false);
      expect(isValidA1('A')).toBe(false);
      expect(isValidA1('A1:')).toBe(false);
      expect(isValidA1(':B2')).toBe(false);
      expect(isValidA1('Sheet1!')).toBe(false);
    });

    it('rejects row 0 (rows are 1-indexed)', () => {
      expect(isValidA1('A0')).toBe(false);
      expect(isValidA1('B01')).toBe(false);
      expect(isValidA1('Sheet1!A0:B5')).toBe(false);
    });
  });

  describe('parseA1', () => {
    it('parses bare cell', () => {
      expect(parseA1('B12')).toEqual({ sheet: null, start: 'B12', end: null });
    });
    it('parses qualified range', () => {
      expect(parseA1('Optimal!B3:B7')).toEqual({
        sheet: 'Optimal',
        start: 'B3',
        end: 'B7',
      });
    });
    it('strips $ in start/end', () => {
      expect(parseA1('$A$1:$B$2')).toEqual({ sheet: null, start: 'A1', end: 'B2' });
    });
    it('parses quoted sheet name with spaces', () => {
      expect(parseA1("'My Sheet'!A1")).toEqual({ sheet: 'My Sheet', start: 'A1', end: null });
    });
    it('returns null on invalid', () => {
      expect(parseA1('garbage')).toBeNull();
    });
  });

  describe('isCellA1 / isRangeA1', () => {
    it('distinguishes cell vs range', () => {
      expect(isCellA1('A1')).toBe(true);
      expect(isCellA1('A1:B2')).toBe(false);
      expect(isRangeA1('A1:B2')).toBe(true);
      expect(isRangeA1('A1')).toBe(false);
    });
  });

  describe('qualifyWithSheet', () => {
    it('prepends sheet if missing', () => {
      expect(qualifyWithSheet('B12', 'Optimal')).toBe('Optimal!B12');
    });
    it('leaves qualified refs untouched', () => {
      expect(qualifyWithSheet('Optimal!B12', 'Other')).toBe('Optimal!B12');
    });
    it('quotes sheet names with spaces', () => {
      expect(qualifyWithSheet('B12', 'My Sheet')).toBe("'My Sheet'!B12");
    });
  });
});
