import { describe, it, expect } from 'vitest';
import { buildSensitivityMatrix } from '../../../src/client/reports/sensitivity';
import type { LinearForm, SolveResult } from '../../../src/shared/linear-form';

function lf(): LinearForm {
  return {
    vars: [
      { name: 'x1', cellA1: 'B3', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
      { name: 'x2', cellA1: 'B4', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
    ],
    objective: { name: 'z', cellA1: 'B12', sense: 'MIN', coefs: [3, 5], constant: 0, originalValue: 0 },
    rows: [
      { name: 'c1', lhsA1: 'D12', op: '<=', coefs: [2, 1], rhs: 10, constant: 0, lhsOriginalValue: 0 },
    ],
  };
}

function sr(): SolveResult {
  return {
    status: 'optimal',
    objective: 15,
    variables: [
      { name: 'x1', primal: 5, dual: 0, rangeUp: 1.5, rangeDown: 0.5 },
      { name: 'x2', primal: 0, dual: 2, rangeUp: null, rangeDown: 2.5 },
    ],
    rows: [{ name: 'c1', primal: 10, dual: 1.5, status: 'upper', rangeUp: 6, rangeDown: 8 }],
    iterations: 5,
    time: 0.012,
    isMip: false,
  };
}

describe('buildSensitivityMatrix', () => {
  it('returns null for MIP problems', () => {
    const mipResult = { ...sr(), isMip: true };
    expect(buildSensitivityMatrix(lf(), mipResult, { sheetName: 's', timestamp: 't' })).toBeNull();
  });

  it('contains both Variable and Constraint sections', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' });
    expect(m).not.toBeNull();
    const flat = m!.flat();
    expect(flat).toContain('Variables de decisión');
    expect(flat).toContain('Restricciones');
  });

  it('shows ∞ when rangeUp is null', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' })!;
    const flat = m.flat();
    expect(flat).toContain('∞');
  });

  it('shows reduced costs and shadow prices', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' })!;
    const flat = m.flat();
    expect(flat).toContain(2);
    expect(flat).toContain(1.5);
  });
});
