import type { SolveStatus } from '../../shared/linear-form';

export function mapStatus(raw: string): SolveStatus {
  const s = (raw || '').toLowerCase();
  if (s === 'optimal') return 'optimal';
  if (s.includes('infeasible')) return 'infeasible';
  if (s.includes('unbounded')) return 'unbounded';
  if (s.includes('time limit')) return 'time_limit';
  if (s.includes('iteration limit')) return 'iter_limit';
  return 'error';
}

export function mapRowStatus(s: string | undefined): 'basic' | 'lower' | 'upper' | 'free' {
  if (!s) return 'free';
  const l = s.toLowerCase();
  // HiGHS uses short codes (BS / LB / UB / EQ / FX) but some configurations
  // emit textual forms (Basic / Lower / Upper / Free / Equal).
  if (l === 'bs' || l.includes('basic')) return 'basic';
  if (l === 'lb' || l.includes('lower')) return 'lower';
  if (l === 'ub' || l.includes('upper')) return 'upper';
  if (l === 'eq' || l === 'fx' || l.includes('equal') || l.includes('fixed')) return 'upper';
  return 'free';
}
