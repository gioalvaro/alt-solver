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
  if (l.includes('basic')) return 'basic';
  if (l.includes('lower')) return 'lower';
  if (l.includes('upper')) return 'upper';
  return 'free';
}
