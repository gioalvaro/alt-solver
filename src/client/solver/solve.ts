import type { LinearForm, SolveResult } from '../../shared/linear-form';
import { getHighs, type HighsRawResult } from './highs-loader';
import { toLpFormat } from './model-builder';
import { mapStatus, mapRowStatus } from './solve-status';

export interface SolveOptions {
  timeLimitSec: number;
  mipRelGap: number;
}

export async function runSolve(lf: LinearForm, opts: SolveOptions): Promise<SolveResult> {
  const highs = await getHighs();
  const lp = toLpFormat(lf);
  const t0 = performance.now();
  let raw: HighsRawResult;
  try {
    raw = highs.solve(lp, {
      time_limit: opts.timeLimitSec,
      mip_rel_gap: opts.mipRelGap,
      output_flag: false,
    });
  } catch (e) {
    return {
      status: 'error',
      objective: 0,
      variables: [],
      rows: [],
      iterations: 0,
      time: (performance.now() - t0) / 1000,
      isMip: lf.vars.some((v) => v.integral),
      message: (e as Error).message,
    };
  }
  const elapsed = (performance.now() - t0) / 1000;

  const status = mapStatus(raw.Status);
  const isMip = lf.vars.some((v) => v.integral);

  const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);

  const variables = lf.vars.map((v, i) => {
    const col = cols[i];
    return {
      name: v.name,
      primal: col?.Primal ?? v.originalValue,
      dual: !isMip && col != null ? col.Dual : null,
      rangeUp: null as number | null,
      rangeDown: null as number | null,
    };
  });

  const rows = lf.rows.map((row, j) => {
    const r = raw.Rows?.[j];
    return {
      name: row.name,
      primal: r?.Primal ?? row.lhsOriginalValue,
      dual: !isMip && r != null ? r.Dual : null,
      status: mapRowStatus(r?.Status),
      rangeUp: null as number | null,
      rangeDown: null as number | null,
    };
  });

  return {
    status,
    objective: raw.ObjectiveValue ?? 0,
    variables,
    rows,
    iterations: 0,
    time: elapsed,
    isMip,
  };
}
