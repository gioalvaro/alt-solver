import type { Sense } from './model-schema';

export interface LinearFormVariable {
  name: string;
  cellA1: string;      // qualified single-cell A1, e.g. "Optimal!B3"
  lower: number;       // -Infinity if free
  upper: number;       // +Infinity if free
  integral: boolean;
  originalValue: number;
}

export interface LinearFormObjective {
  name: string;
  cellA1: string;
  sense: Sense;
  coefs: number[];     // length = vars.length
  constant: number;    // value when all vars = 0
  originalValue: number;
}

export interface LinearFormRow {
  name: string;
  lhsA1: string;
  op: '<=' | '=' | '>=';
  coefs: number[];     // length = vars.length
  rhs: number;         // resolved (cell ref already read)
  constant: number;    // LHS evaluated when all vars = 0
  lhsOriginalValue: number;
}

export interface LinearForm {
  vars: LinearFormVariable[];
  objective: LinearFormObjective;
  rows: LinearFormRow[];
}

export function emptyLinearForm(sense: Sense): LinearForm {
  return {
    vars: [],
    objective: { name: '', cellA1: '', sense, coefs: [], constant: 0, originalValue: 0 },
    rows: [],
  };
}

export type SolveStatus =
  | 'optimal'
  | 'infeasible'
  | 'unbounded'
  | 'time_limit'
  | 'iter_limit'
  | 'error';

export interface SolveResultVariable {
  name: string;
  primal: number;
  dual: number | null;        // reduced cost (LP only)
  rangeUp: number | null;     // allowable increase of obj coef (LP only)
  rangeDown: number | null;
}

export interface SolveResultRow {
  name: string;
  primal: number;             // LHS value
  dual: number | null;        // shadow price (LP only)
  status: 'basic' | 'lower' | 'upper' | 'free';
  rangeUp: number | null;     // allowable increase of RHS (LP only)
  rangeDown: number | null;
}

export interface SolveResult {
  status: SolveStatus;
  objective: number;
  variables: SolveResultVariable[];
  rows: SolveResultRow[];
  iterations: number;
  time: number;        // seconds
  isMip: boolean;
  mipGap?: number;     // present when isMip
  message?: string;    // human-readable detail when status != optimal
}
