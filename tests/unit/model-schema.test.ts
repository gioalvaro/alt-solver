import { describe, it, expect } from 'vitest';
import {
  validateModelDocument,
  blankModelDocument,
  type ModelDocument,
} from '../../src/shared/model-schema';

describe('model-schema', () => {
  describe('blankModelDocument', () => {
    it('creates a valid empty model with version 1', () => {
      const doc = blankModelDocument(123, 'Hoja1');
      expect(doc.version).toBe(1);
      expect(doc.sheetId).toBe(123);
      expect(doc.objective.cellA1).toBe('');
      expect(doc.objective.sense).toBe('MIN');
      expect(doc.variables.rangeA1).toBe('');
      expect(doc.constraints).toEqual([]);
      expect(doc.options.assumeNonNegative).toBe(true);
    });
  });

  describe('validateModelDocument', () => {
    function valid(): ModelDocument {
      return {
        version: 1,
        sheetId: 1,
        objective: { cellA1: 'A1', sense: 'MAX', targetValue: null },
        variables: { rangeA1: 'B1:B5', names: [], assumeNonNegative: true },
        constraints: [],
        options: {
          assumeNonNegative: true,
          timeLimitSec: 100,
          iterLimit: null,
          mipGap: 1e-4,
          integerTolerance: 1e-6,
        },
        meta: { createdAt: '2026-05-18T00:00:00Z', updatedAt: '2026-05-18T00:00:00Z', solvedAt: null, locale: 'es' },
      };
    }

    it('accepts a complete valid document', () => {
      const r = validateModelDocument(valid());
      expect(r.ok).toBe(true);
    });

    it('rejects wrong version', () => {
      const d = valid();
      (d as any).version = 99;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]).toMatch(/version/);
    });

    it('rejects invalid sense', () => {
      const d = valid();
      (d.objective as any).sense = 'FOO';
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('rejects invalid A1 in objective', () => {
      const d = valid();
      d.objective.cellA1 = 'not-a-cell';
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('requires targetValue when sense=TARGET', () => {
      const d = valid();
      d.objective.sense = 'TARGET';
      d.objective.targetValue = null;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('accepts constraint with linear op and RHS', () => {
      const d = valid();
      d.constraints.push({ lhsA1: 'D1', op: '<=', rhsA1OrValue: '10', type: 'linear' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(true);
    });

    it('rejects linear constraint missing RHS', () => {
      const d = valid();
      (d.constraints as any).push({ lhsA1: 'D1', op: '<=', type: 'linear' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('accepts int/bin constraint without RHS', () => {
      const d = valid();
      d.constraints.push({ lhsA1: 'B1:B5', op: 'int' });
      d.constraints.push({ lhsA1: 'B1', op: 'bin' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(true);
    });

    it('rejects non-positive timeLimitSec', () => {
      const d = valid();
      d.options.timeLimitSec = 0;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });
  });
});
