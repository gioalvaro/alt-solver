import type { LinearForm } from '../../shared/linear-form';
import { toLpFormat } from './model-builder';
import { mapStatus } from './solve-status';
import type { HighsRawResult } from './highs-loader';

interface HighsLike {
  solve(lp: string, options?: Record<string, unknown>): HighsRawResult;
}

export interface IISConstraint {
  index: number;
  name: string;
  lhsA1: string;
  op: string;
  rhs: number;
}

export interface InfeasibilityDiagnosis {
  iis: IISConstraint[];
  /** Plain-Spanish description of what is contradictory and what to try. */
  suggestions: string[];
}

export interface GrowingVar {
  index: number;
  name: string;
  cellA1: string;
  /** Sense of the unbounded growth, in the objective's direction. */
  direction: 'up' | 'down';
}

export interface UnboundednessDiagnosis {
  growingVars: GrowingVar[];
  suggestions: string[];
}

/**
 * Deletion-filter algorithm: find an irreducible infeasible subset of
 * linear constraints. A constraint is in the IIS iff removing it would
 * make the problem feasible (given the remaining members of the IIS).
 *
 * Cost: n solves where n is the number of linear constraints (int/bin
 * constraints are kept as bounds always). Sub-second for didactic LPs.
 *
 * Returns the smallest set of constraints whose pairwise interaction
 * makes the problem infeasible, plus a human-readable suggestion.
 */
export function diagnoseInfeasibility(
  highs: HighsLike,
  lf: LinearForm,
  opts: { time_limit: number; mip_rel_gap: number },
): InfeasibilityDiagnosis {
  function isInfeasible(rowIndices: number[]): boolean {
    const lf2 = cloneLfSlim(lf, rowIndices);
    let raw: HighsRawResult;
    try {
      raw = highs.solve(toLpFormat(lf2), opts);
    } catch {
      return true; // treat solver errors as infeasibility for safety
    }
    return mapStatus(raw.Status) === 'infeasible';
  }

  // Start with all linear rows; integrality stays implicit via the LinearForm.
  let active: number[] = lf.rows.map((_, i) => i);

  // Sanity: if the full problem isn't infeasible, the diagnosis is empty.
  if (!isInfeasible(active)) {
    return { iis: [], suggestions: ['No se detectó conflicto entre restricciones.'] };
  }

  // Deletion filter.
  for (let i = 0; i < lf.rows.length; i++) {
    const trimmed = active.filter((j) => j !== i);
    if (isInfeasible(trimmed)) {
      // i was redundant for infeasibility — permanently drop it.
      active = trimmed;
    }
  }

  const iis: IISConstraint[] = active.map((idx) => {
    const row = lf.rows[idx]!;
    return {
      index: idx,
      name: row.name,
      lhsA1: row.lhsA1,
      op: row.op,
      rhs: row.rhs,
    };
  });

  const suggestions: string[] = [];
  if (iis.length === 1) {
    suggestions.push(
      'La restricción ' + iis[0]!.name + ' (' + iis[0]!.lhsA1 + ' ' + iis[0]!.op + ' ' + iis[0]!.rhs + ') no puede satisfacerse junto a las cotas de no negatividad. Revisá su lado derecho o el sentido de la desigualdad.',
    );
  } else if (iis.length === 2) {
    suggestions.push(
      'Las restricciones ' + iis[0]!.name + ' y ' + iis[1]!.name + ' son mutuamente incompatibles. Probablemente una pide un mínimo que la otra prohíbe — relajar el lado derecho de cualquiera de las dos debería volver el modelo factible.',
    );
  } else {
    const names = iis.map(function (c) { return c.name; }).join(', ');
    suggestions.push(
      'Las siguientes restricciones forman un conflicto: ' + names + '. Conviene revisar cada lado derecho — alguno está fijando un valor que el resto no puede cumplir.',
    );
  }

  return { iis, suggestions };
}

/**
 * Detects which variables can grow without bound. Approach: cap every
 * variable's upper bound at M (1e9) and re-solve. Any variable that hits
 * its new artificial cap is a member of the unbounded ray.
 *
 * Cost: one extra solve.
 */
export function diagnoseUnboundedness(
  highs: HighsLike,
  lf: LinearForm,
  opts: { time_limit: number; mip_rel_gap: number },
): UnboundednessDiagnosis {
  const M = 1e9;
  const lf2: LinearForm = JSON.parse(JSON.stringify(lf));
  for (const v of lf2.vars) {
    if (v.upper >= 1e30) v.upper = M;
    if (v.lower <= -1e30) v.lower = -M;
  }

  let raw: HighsRawResult;
  try {
    raw = highs.solve(toLpFormat(lf2), opts);
  } catch {
    return {
      growingVars: [],
      suggestions: ['No se pudo identificar las variables que crecen sin límite.'],
    };
  }

  if (mapStatus(raw.Status) !== 'optimal') {
    return {
      growingVars: [],
      suggestions: ['El modelo sigue sin tener una solución acotada incluso con cotas grandes.'],
    };
  }

  const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);
  const growingVars: GrowingVar[] = [];
  const tol = M * 0.001; // 0.1% of M counts as "at the cap"
  cols.forEach((col, i) => {
    if (i >= lf.vars.length) return;
    const v = lf.vars[i]!;
    if (Math.abs(col.Primal - M) < tol) {
      growingVars.push({ index: i, name: v.name, cellA1: v.cellA1, direction: 'up' });
    } else if (Math.abs(col.Primal + M) < tol) {
      growingVars.push({ index: i, name: v.name, cellA1: v.cellA1, direction: 'down' });
    }
  });

  const suggestions: string[] = [];
  if (growingVars.length === 0) {
    suggestions.push('No se identificó una variable específica que crezca sin límite.');
  } else if (growingVars.length === 1) {
    const g = growingVars[0]!;
    suggestions.push(
      'La variable ' + g.name + ' (' + g.cellA1 + ') puede crecer indefinidamente mejorando el objetivo. Agregá una cota superior (por ejemplo ' + g.name + ' ≤ 100) o una restricción que la limite.',
    );
  } else {
    const varNames = growingVars.map(function (g) { return g.name + ' (' + g.cellA1 + ')'; }).join(', ');
    suggestions.push(
      'Las variables ' + varNames + ' pueden crecer juntas sin límite mejorando el objetivo. Falta una restricción que limite su combinación — probá agregar una cota a su suma o a cada una.',
    );
  }

  return { growingVars, suggestions };
}

/**
 * Builds a slim LP that only includes the listed linear-constraint indices
 * plus the model's integrality and bounds. Used for IIS bisection.
 */
function cloneLfSlim(lf: LinearForm, rowIndices: number[]): LinearForm {
  const set = new Set(rowIndices);
  return {
    vars: lf.vars.map((v) => ({ ...v })),
    objective: { ...lf.objective, coefs: [...lf.objective.coefs] },
    rows: lf.rows
      .filter((_, i) => set.has(i))
      .map((r) => ({ ...r, coefs: [...r.coefs] })),
  };
}
