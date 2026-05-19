import { t } from '../i18n/i18n';

export type ErrorCode =
  | 'objective_empty'
  | 'variables_empty'
  | 'a1_invalid'
  | 'eval_not_number'
  | 'var_has_formula'
  | 'linearity_warning'
  | 'integrality_outside_vars'
  | 'solver_infeasible'
  | 'solver_unbounded'
  | 'solver_time_limit_feasible'
  | 'solver_time_limit_no_feasible'
  | 'solver_error'
  | 'rpc_failed'
  | 'wasm_load_failed'
  | 'quota_exceeded';

export interface ErrorParams {
  cell?: string;
  value?: string;
  cells?: string[];
  reason?: string;
  gap?: number;
}

const TEMPLATES: Record<ErrorCode, string> = {
  objective_empty: 'err.objective_empty',
  variables_empty: 'err.variables_empty',
  a1_invalid: 'err.a1_invalid',
  eval_not_number: 'err.eval_not_number',
  var_has_formula: 'err.var_has_formula',
  linearity_warning: 'err.linearity_warning',
  integrality_outside_vars: 'err.integrality_outside_vars',
  solver_infeasible: 'err.solver_infeasible',
  solver_unbounded: 'err.solver_unbounded',
  solver_time_limit_feasible: 'err.solver_time_limit_feasible',
  solver_time_limit_no_feasible: 'err.solver_time_limit_no_feasible',
  solver_error: 'err.solver_error',
  rpc_failed: 'err.rpc_failed',
  wasm_load_failed: 'err.wasm_load_failed',
  quota_exceeded: 'err.quota_exceeded',
};

export function errorMessage(code: ErrorCode, params: ErrorParams): string {
  const template = t(TEMPLATES[code]);
  return interpolate(template, params);
}

function interpolate(template: string, params: ErrorParams): string {
  return template
    .replace('{cell}', params.cell ?? '')
    .replace('{value}', params.value ?? '')
    .replace('{cells}', (params.cells ?? []).join(', '))
    .replace('{reason}', params.reason ?? '')
    .replace('{gap}', params.gap != null ? `${(params.gap * 100).toFixed(2)}%` : '');
}
