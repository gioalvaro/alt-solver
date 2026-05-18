import { isValidA1 } from './a1';
import { DEFAULT_OPTIONS, SCHEMA_VERSION } from './constants';

export type Sense = 'MAX' | 'MIN' | 'TARGET';
export type LinearOp = '<=' | '=' | '>=';
export type ConstraintOp = LinearOp | 'int' | 'bin';

export interface LinearConstraint {
  lhsA1: string;
  op: LinearOp;
  rhsA1OrValue: string; // either A1 ref or numeric literal as string
  type: 'linear';
}

export interface IntegralityConstraint {
  lhsA1: string;
  op: 'int' | 'bin';
}

export type Constraint = LinearConstraint | IntegralityConstraint;

export interface Objective {
  cellA1: string;
  sense: Sense;
  targetValue: number | null; // required when sense=TARGET
}

export interface Variables {
  rangeA1: string;
  names: string[];          // optional, inferred at solve time if empty
  assumeNonNegative: boolean;
}

export interface SolverOptions {
  assumeNonNegative: boolean;
  timeLimitSec: number;
  iterLimit: number | null;
  mipGap: number;
  integerTolerance: number;
}

export interface ModelMeta {
  createdAt: string;
  updatedAt: string;
  solvedAt: string | null;
  locale: 'es' | 'en';
}

export interface ModelDocument {
  version: 1;
  sheetId: number;
  objective: Objective;
  variables: Variables;
  constraints: Constraint[];
  options: SolverOptions;
  meta: ModelMeta;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function blankModelDocument(sheetId: number, _sheetName: string): ModelDocument {
  const now = new Date().toISOString();
  return {
    version: SCHEMA_VERSION,
    sheetId,
    objective: { cellA1: '', sense: 'MIN', targetValue: null },
    variables: { rangeA1: '', names: [], assumeNonNegative: true },
    constraints: [],
    options: { ...DEFAULT_OPTIONS },
    meta: { createdAt: now, updatedAt: now, solvedAt: null, locale: 'es' },
  };
}

export function validateModelDocument(doc: unknown): ValidationResult {
  const errors: string[] = [];
  if (!doc || typeof doc !== 'object') return { ok: false, errors: ['root must be an object'] };
  const d = doc as Record<string, unknown>;

  if (d.version !== SCHEMA_VERSION) errors.push(`version must be ${SCHEMA_VERSION}`);
  if (typeof d.sheetId !== 'number') errors.push('sheetId must be a number');

  // objective
  const obj = d.objective as Record<string, unknown> | undefined;
  if (!obj) {
    errors.push('objective missing');
  } else {
    if (typeof obj.cellA1 !== 'string' || (obj.cellA1 !== '' && !isValidA1(obj.cellA1))) {
      errors.push('objective.cellA1 must be empty or valid A1');
    }
    if (obj.sense !== 'MAX' && obj.sense !== 'MIN' && obj.sense !== 'TARGET') {
      errors.push('objective.sense must be MAX|MIN|TARGET');
    }
    if (obj.sense === 'TARGET' && typeof obj.targetValue !== 'number') {
      errors.push('objective.targetValue required when sense=TARGET');
    }
  }

  // variables
  const vars = d.variables as Record<string, unknown> | undefined;
  if (!vars) {
    errors.push('variables missing');
  } else {
    if (typeof vars.rangeA1 !== 'string' || (vars.rangeA1 !== '' && !isValidA1(vars.rangeA1))) {
      errors.push('variables.rangeA1 must be empty or valid A1');
    }
    if (!Array.isArray(vars.names)) errors.push('variables.names must be array');
    if (typeof vars.assumeNonNegative !== 'boolean') errors.push('variables.assumeNonNegative must be boolean');
  }

  // constraints
  const cons = d.constraints;
  if (!Array.isArray(cons)) {
    errors.push('constraints must be array');
  } else {
    cons.forEach((c, i) => {
      const cc = c as Record<string, unknown>;
      if (typeof cc.lhsA1 !== 'string' || !isValidA1(cc.lhsA1)) {
        errors.push(`constraints[${i}].lhsA1 invalid`);
      }
      if (cc.op === '<=' || cc.op === '=' || cc.op === '>=') {
        if (cc.type !== 'linear') errors.push(`constraints[${i}].type must be 'linear' for op ${cc.op}`);
        if (typeof cc.rhsA1OrValue !== 'string' || cc.rhsA1OrValue === '') {
          errors.push(`constraints[${i}].rhsA1OrValue required`);
        }
      } else if (cc.op === 'int' || cc.op === 'bin') {
        // no rhs needed
      } else {
        errors.push(`constraints[${i}].op invalid`);
      }
    });
  }

  // options
  const opt = d.options as Record<string, unknown> | undefined;
  if (!opt) {
    errors.push('options missing');
  } else {
    if (typeof opt.assumeNonNegative !== 'boolean') errors.push('options.assumeNonNegative must be boolean');
    if (typeof opt.timeLimitSec !== 'number' || opt.timeLimitSec <= 0) {
      errors.push('options.timeLimitSec must be > 0');
    }
    if (opt.iterLimit !== null && (typeof opt.iterLimit !== 'number' || opt.iterLimit <= 0)) {
      errors.push('options.iterLimit must be null or > 0');
    }
    if (typeof opt.mipGap !== 'number' || opt.mipGap < 0) errors.push('options.mipGap must be ≥ 0');
    if (typeof opt.integerTolerance !== 'number' || opt.integerTolerance <= 0) {
      errors.push('options.integerTolerance must be > 0');
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
