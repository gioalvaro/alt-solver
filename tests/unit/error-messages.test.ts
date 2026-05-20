import { describe, it, expect } from 'vitest';
import { errorMessage, type ErrorCode } from '../../src/client/errors/error-messages';

describe('error-messages', () => {
  it('returns the right key for each error code', () => {
    const codes: ErrorCode[] = [
      'objective_empty', 'variables_empty', 'a1_invalid',
      'eval_not_number', 'var_has_formula', 'linearity_warning',
      'integrality_outside_vars', 'solver_infeasible', 'solver_unbounded',
      'solver_time_limit_feasible', 'solver_time_limit_no_feasible',
      'solver_error', 'rpc_failed', 'wasm_load_failed', 'quota_exceeded',
    ];
    for (const code of codes) {
      const msg = errorMessage(code, {});
      expect(msg.length).toBeGreaterThan(5);
    }
  });

  it('interpolates parameters', () => {
    const msg = errorMessage('eval_not_number', { cell: 'D12', value: '#REF!' });
    expect(msg).toContain('D12');
    expect(msg).toContain('#REF!');
  });
});
