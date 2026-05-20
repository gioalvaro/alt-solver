import type { LinearForm, SolveResult } from '../../shared/linear-form';
import { getHighs, type HighsRawResult } from './highs-loader';
import { toLpFormat } from './model-builder';
import { mapStatus, mapRowStatus } from './solve-status';
import { computeRanging } from './ranging';
import { diagnoseInfeasibility, diagnoseUnboundedness } from './diagnostics';

export interface SolveOptions {
  timeLimitSec: number;
  mipRelGap: number;
}

export async function runSolve(lf: LinearForm, opts: SolveOptions): Promise<SolveResult> {
  const highs = await getHighs();
  const lp = toLpFormat(lf);
  // Always log the LP for diagnostics — printed to the dialog iframe's
  // DevTools console. Cheap, invaluable for debugging extraction issues.
  console.warn('[AltSolver] LP file sent to HiGHS:\n' + lp);
  console.warn('[AltSolver] LinearForm:', JSON.stringify(lf, null, 2));
  const t0 = performance.now();
  let raw: HighsRawResult;
  try {
    // NOTE: do not pass output_flag:false — highs-js parses the textual
    // solution output to build the result object. Suppressing output
    // breaks parsing with 'Unable to parse solution. Too few lines.'
    raw = highs.solve(lp, {
      time_limit: opts.timeLimitSec,
      mip_rel_gap: opts.mipRelGap,
    });
    console.warn('[AltSolver] Raw HiGHS result:', JSON.stringify(raw, null, 2));
  } catch (e) {
    console.error('[AltSolver] HiGHS threw:', e);
    return {
      status: 'error',
      objective: 0,
      variables: [],
      rows: [],
      iterations: 0,
      time: (performance.now() - t0) / 1000,
      isMip: lf.vars.some((v) => v.integral),
      message: `HiGHS exception: ${(e as Error).message || String(e)}`,
    };
  }
  const elapsed = (performance.now() - t0) / 1000;

  const status = mapStatus(raw.Status);
  const isMip = lf.vars.some((v) => v.integral);

  // Surface the raw status if HiGHS rejected the model with something we
  // don't have a friendly mapping for — much easier to debug than just "error".
  const rawStatusMessage = status === 'error' ? `HiGHS: ${raw.Status || 'sin status'}` : undefined;

  const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);

  // Compute ranges only for LP problems (sensitivity analysis is not defined
  // for MIP). The basis-change bisection is sub-second for didactic problems.
  let ranging: ReturnType<typeof computeRanging> | null = null;
  if (!isMip && status === 'optimal') {
    try {
      ranging = computeRanging(highs, lf, raw, {
        time_limit: opts.timeLimitSec,
        mip_rel_gap: opts.mipRelGap,
      });
    } catch (e) {
      console.warn('[AltSolver] ranging computation failed:', e);
    }
  }

  const variables = lf.vars.map((v, i) => {
    const col = cols[i];
    return {
      name: v.name,
      primal: col?.Primal ?? v.originalValue,
      dual: !isMip && col != null ? col.Dual : null,
      rangeUp: ranging?.varRangeUp[i] ?? null,
      rangeDown: ranging?.varRangeDown[i] ?? null,
    };
  });

  const rows = lf.rows.map((row, j) => {
    const r = raw.Rows?.[j];
    return {
      name: row.name,
      primal: r?.Primal ?? row.lhsOriginalValue,
      dual: !isMip && r != null ? r.Dual : null,
      status: mapRowStatus(r?.Status),
      rangeUp: ranging?.rowRangeUp[j] ?? null,
      rangeDown: ranging?.rowRangeDown[j] ?? null,
    };
  });

  // Run targeted diagnostics for the two error states the user can fix.
  let infeasibilityIIS: SolveResult['infeasibilityIIS'];
  let infeasibilitySuggestions: SolveResult['infeasibilitySuggestions'];
  let unboundedVars: SolveResult['unboundedVars'];
  let unboundedSuggestions: SolveResult['unboundedSuggestions'];
  if (status === 'infeasible' && !isMip) {
    try {
      const d = diagnoseInfeasibility(highs, lf, { time_limit: opts.timeLimitSec, mip_rel_gap: opts.mipRelGap });
      infeasibilityIIS = d.iis;
      infeasibilitySuggestions = d.suggestions;
    } catch (e) {
      console.warn('[AltSolver] Infeasibility diagnosis failed:', e);
    }
  }
  if (status === 'unbounded' && !isMip) {
    try {
      const d = diagnoseUnboundedness(highs, lf, { time_limit: opts.timeLimitSec, mip_rel_gap: opts.mipRelGap });
      unboundedVars = d.growingVars;
      unboundedSuggestions = d.suggestions;
    } catch (e) {
      console.warn('[AltSolver] Unboundedness diagnosis failed:', e);
    }
  }

  return {
    status,
    objective: raw.ObjectiveValue ?? 0,
    variables,
    rows,
    iterations: 0,
    time: elapsed,
    isMip,
    message: rawStatusMessage,
    infeasibilityIIS,
    infeasibilitySuggestions,
    unboundedVars,
    unboundedSuggestions,
  };
}
