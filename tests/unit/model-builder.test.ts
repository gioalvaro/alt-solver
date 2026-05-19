import { describe, it, expect } from 'vitest';
import { toLpFormat } from '../../src/client/solver/model-builder';
import type { LinearForm } from '../../src/shared/linear-form';

function makeLf(): LinearForm {
  return {
    vars: [
      { name: 'x1', cellA1: 'B3', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
      { name: 'x2', cellA1: 'B4', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
    ],
    objective: { name: 'z', cellA1: 'B12', sense: 'MIN', coefs: [3, 5], constant: 0, originalValue: 0 },
    rows: [
      { name: 'c1', lhsA1: 'D12', op: '<=', coefs: [2, 1], rhs: 10, constant: 0, lhsOriginalValue: 0 },
      { name: 'c2', lhsA1: 'D13', op: '>=', coefs: [1, 3], rhs: 12, constant: 0, lhsOriginalValue: 0 },
    ],
  };
}

describe('toLpFormat', () => {
  it('emits MIN with sense Minimize', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toMatch(/^Minimize/m);
  });

  it('emits objective with coefficients', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toContain('3 x1 + 5 x2');
  });

  it('emits constraints in canonical form', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toContain('2 x1 + 1 x2 <= 10');
    expect(lp).toContain('1 x1 + 3 x2 >= 12');
  });

  it('handles MAX by reversing sense in objective declaration', () => {
    const lf = makeLf();
    lf.objective.sense = 'MAX';
    const lp = toLpFormat(lf);
    expect(lp).toMatch(/^Maximize/m);
  });

  it('emits bounds section with lower/upper', () => {
    const lf = makeLf();
    lf.vars[0]!.upper = 100;
    const lp = toLpFormat(lf);
    expect(lp).toContain('Bounds');
    expect(lp).toContain('x1 <= 100');
  });

  it('emits General section for integer vars', () => {
    const lf = makeLf();
    lf.vars[0]!.integral = true;
    const lp = toLpFormat(lf);
    expect(lp).toContain('General');
    expect(lp).toContain('x1');
  });

  it('emits Binary section for binary vars (integral + 0..1)', () => {
    const lf = makeLf();
    lf.vars[0]!.integral = true;
    lf.vars[0]!.lower = 0;
    lf.vars[0]!.upper = 1;
    const lp = toLpFormat(lf);
    expect(lp).toContain('Binary');
    expect(lp).toContain('x1');
  });

  it('skips zero coefficients in constraints', () => {
    const lf = makeLf();
    lf.rows[0]!.coefs = [0, 1];
    const lp = toLpFormat(lf);
    expect(lp).toContain('1 x2 <= 10');
    expect(lp).not.toContain('0 x1 + 1 x2');
  });

  it('ends with End line', () => {
    const lp = toLpFormat(makeLf());
    expect(lp.trim()).toMatch(/End$/);
  });
});
