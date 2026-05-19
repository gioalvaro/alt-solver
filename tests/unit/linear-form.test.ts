import { describe, it, expect } from 'vitest';
import {
  type LinearForm,
  type SolveResult,
  type SolveStatus,
  emptyLinearForm,
} from '../../src/shared/linear-form';

describe('linear-form types', () => {
  it('emptyLinearForm has zero vars and zero rows', () => {
    const lf = emptyLinearForm('MIN');
    expect(lf.vars).toEqual([]);
    expect(lf.rows).toEqual([]);
    expect(lf.objective.sense).toBe('MIN');
    expect(lf.objective.coefs).toEqual([]);
    expect(lf.objective.constant).toBe(0);
  });

  it('SolveStatus admits expected literals', () => {
    const cases: SolveStatus[] = ['optimal', 'infeasible', 'unbounded', 'time_limit', 'iter_limit', 'error'];
    expect(cases.length).toBe(6);
  });

  it('LinearForm allows binary variables (integral + lower 0 + upper 1)', () => {
    const lf: LinearForm = {
      vars: [{ name: 'x', cellA1: 'B3', lower: 0, upper: 1, integral: true, originalValue: 0 }],
      objective: { name: 'z', cellA1: 'B1', sense: 'MAX', coefs: [1], constant: 0, originalValue: 0 },
      rows: [],
    };
    expect(lf.vars[0]?.integral).toBe(true);
    expect(lf.vars[0]?.upper).toBe(1);
  });
});
