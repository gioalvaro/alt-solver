import type { LinearForm } from '../../shared/linear-form';
import type { HighsRawResult } from './highs-loader';
import { toLpFormat } from './model-builder';
import { mapStatus } from './solve-status';

interface HighsLike {
  solve(lp: string, options?: Record<string, unknown>): HighsRawResult;
}

interface BasisSignature {
  cols: string[];
  rows: string[];
}

function basisOf(raw: HighsRawResult, n: number): BasisSignature {
  const cols = new Array<string>(n).fill('');
  Object.values(raw.Columns || {}).forEach((c) => {
    if (c.Index >= 0 && c.Index < n) cols[c.Index] = c.Status;
  });
  const rows = (raw.Rows || []).map((r) => r.Status);
  return { cols, rows };
}

function sameBasis(a: BasisSignature, b: BasisSignature): boolean {
  if (a.cols.length !== b.cols.length || a.rows.length !== b.rows.length) return false;
  for (let i = 0; i < a.cols.length; i++) if (a.cols[i] !== b.cols[i]) return false;
  for (let i = 0; i < a.rows.length; i++) if (a.rows[i] !== b.rows[i]) return false;
  return true;
}

export interface RangingResult {
  varRangeUp: number[];
  varRangeDown: number[];
  rowRangeUp: number[];
  rowRangeDown: number[];
}

/**
 * Computes allowable increase/decrease ranges for objective coefficients and
 * constraint RHS values by bisection: perturb each parameter and check
 * whether the optimal basis (the set of basic variables / row statuses)
 * remains the same.
 *
 * For an LP with n variables and m linear constraints, this performs
 * ~25 solves per parameter × 2(n+m) parameters. Each solve is sub-millisecond
 * for didactic problems, so total cost is <100ms for typical inputs.
 *
 * Returns Infinity when the parameter can vary unboundedly without changing
 * the basis (e.g., increasing the obj coef of a non-basic variable in max).
 */
export function computeRanging(
  highs: HighsLike,
  lf: LinearForm,
  baseResult: HighsRawResult,
  opts: { time_limit: number; mip_rel_gap: number },
): RangingResult {
  const n = lf.vars.length;
  const m = lf.rows.length;
  const baseBasis = basisOf(baseResult, n);

  function solveAndCheckBasis(perturbedLf: LinearForm): boolean {
    const lp = toLpFormat(perturbedLf);
    let result: HighsRawResult;
    try {
      result = highs.solve(lp, opts);
    } catch {
      return false;
    }
    if (mapStatus(result.Status) !== 'optimal') return false;
    return sameBasis(baseBasis, basisOf(result, n));
  }

  function bisectMaxDelta(test: (d: number) => boolean, scale: number): number {
    const upperLimit = scale * 1e3;
    // If even the upper limit doesn't change the basis, the range is unbounded.
    if (test(upperLimit)) return Infinity;
    if (!test(0)) return 0; // perturbed-by-zero should always pass; sanity bail-out
    let lo = 0;
    let hi = upperLimit;
    for (let iter = 0; iter < 25; iter++) {
      const mid = (lo + hi) / 2;
      if (test(mid)) lo = mid;
      else hi = mid;
      if (hi - lo < 1e-6 * scale) break;
    }
    return lo;
  }

  function cloneLf(): LinearForm {
    return JSON.parse(JSON.stringify(lf)) as LinearForm;
  }

  const varRangeUp = new Array<number>(n).fill(0);
  const varRangeDown = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const c0 = lf.objective.coefs[i] ?? 0;
    const scale = Math.max(Math.abs(c0), 1);
    varRangeUp[i] = bisectMaxDelta((d) => {
      const lf2 = cloneLf();
      lf2.objective.coefs[i] = c0 + d;
      return solveAndCheckBasis(lf2);
    }, scale);
    varRangeDown[i] = bisectMaxDelta((d) => {
      const lf2 = cloneLf();
      lf2.objective.coefs[i] = c0 - d;
      return solveAndCheckBasis(lf2);
    }, scale);
  }

  const rowRangeUp = new Array<number>(m).fill(0);
  const rowRangeDown = new Array<number>(m).fill(0);
  for (let j = 0; j < m; j++) {
    const b0 = lf.rows[j]?.rhs ?? 0;
    const scale = Math.max(Math.abs(b0), 1);
    rowRangeUp[j] = bisectMaxDelta((d) => {
      const lf2 = cloneLf();
      const row = lf2.rows[j];
      if (row) row.rhs = b0 + d;
      return solveAndCheckBasis(lf2);
    }, scale);
    rowRangeDown[j] = bisectMaxDelta((d) => {
      const lf2 = cloneLf();
      const row = lf2.rows[j];
      if (row) row.rhs = b0 - d;
      return solveAndCheckBasis(lf2);
    }, scale);
  }

  return { varRangeUp, varRangeDown, rowRangeUp, rowRangeDown };
}
