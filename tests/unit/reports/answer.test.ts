import { describe, it, expect } from 'vitest';
import { buildAnswerMatrix } from '../../../src/client/reports/answer';
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
      { name: 'x1', primal: 5, dual: 0, rangeUp: null, rangeDown: null },
      { name: 'x2', primal: 0, dual: 2, rangeUp: null, rangeDown: null },
    ],
    rows: [{ name: 'c1', primal: 10, dual: 1.5, status: 'upper', rangeUp: null, rangeDown: null }],
    iterations: 5,
    time: 0.012,
    isMip: false,
  };
}

describe('buildAnswerMatrix', () => {
  it('produces a matrix starting with the title', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    expect(m[0]?.[0]).toBe('AltSolver · Informe de Respuesta');
  });

  it('contains the objective row with original and final values', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('z');
    expect(flat).toContain(0);
    expect(flat).toContain(15);
  });

  it('lists each variable with its tipo', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('x1');
    expect(flat).toContain(5);
    expect(flat).toContain('Continua');
  });

  it('marks binding constraints (<= and =) and shows slack', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('● Vinculante');
  });
});
