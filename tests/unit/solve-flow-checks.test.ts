import { describe, it, expect } from 'vitest';
import { emptyLpDiagnostic } from '../../src/client/ui/solve-flow-checks';
import type { LinearForm } from '../../src/shared/linear-form';

function lf(args: { objCoefs: number[]; rowsCoefs: number[][] }): LinearForm {
  return {
    vars: args.objCoefs.map((_, i) => ({
      name: 'x' + (i + 1),
      cellA1: 'B' + (3 + i),
      lower: 0,
      upper: Infinity,
      integral: false,
      originalValue: 0,
    })),
    objective: {
      name: 'z',
      cellA1: 'B12',
      sense: 'MIN',
      coefs: args.objCoefs,
      constant: 0,
      originalValue: 0,
    },
    rows: args.rowsCoefs.map((coefs, i) => ({
      name: 'c' + (i + 1),
      lhsA1: 'D' + (12 + i),
      op: '<=' as const,
      coefs,
      rhs: 10,
      constant: 0,
      lhsOriginalValue: 0,
    })),
  };
}

describe('emptyLpDiagnostic', () => {
  it('returns null when the objective has coefficients', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [3, 5], rowsCoefs: [[1, 2]] }));
    expect(m).toBeNull();
  });

  it('returns null when at least one row has coefficients', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [0, 0], rowsCoefs: [[1, 0]] }));
    expect(m).toBeNull();
  });

  it('returns null when there are no rows (the objective is the whole problem)', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [3, 5], rowsCoefs: [] }));
    expect(m).toBeNull();
  });

  it('flags the both-empty case with the objective cell and LHS A1s in the message', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [0, 0], rowsCoefs: [[0, 0], [0, 0]] }));
    expect(m).not.toBeNull();
    expect(m!).toContain('Ni el objetivo ni las restricciones dependen');
    expect(m!).toContain('B12');
    expect(m!).toContain('D12');
    expect(m!).toContain('D13');
  });

  it('flags the rows-only-empty case (objective has coefs but no row does)', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [3, 5], rowsCoefs: [[0, 0]] }));
    expect(m).not.toBeNull();
    expect(m!).toContain('Ninguna de las restricciones depende');
    expect(m!).not.toContain('Ni el objetivo');
  });

  it('treats coefficients below 1e-12 as zero (numerical noise from perturbation)', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [1e-15, -1e-15], rowsCoefs: [[1e-13, 0]] }));
    expect(m).not.toBeNull();
    expect(m!).toContain('Ni el objetivo ni las restricciones dependen');
  });

  it('keeps a coefficient just above 1e-12 as material', () => {
    const m = emptyLpDiagnostic(lf({ objCoefs: [2e-12, 0], rowsCoefs: [[0, 0]] }));
    expect(m).not.toBeNull();
    expect(m!).toContain('Ninguna de las restricciones depende');
  });
});
