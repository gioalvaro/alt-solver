import { describe, it, expect } from 'vitest';
import { mapStatus } from '../../src/client/solver/solve';

describe('mapStatus', () => {
  it('Optimal → optimal', () => {
    expect(mapStatus('Optimal')).toBe('optimal');
  });
  it('Infeasible → infeasible', () => {
    expect(mapStatus('Infeasible')).toBe('infeasible');
    expect(mapStatus('Primal infeasible')).toBe('infeasible');
  });
  it('Unbounded → unbounded', () => {
    expect(mapStatus('Unbounded')).toBe('unbounded');
    expect(mapStatus('Primal unbounded')).toBe('unbounded');
  });
  it('Time limit reached → time_limit', () => {
    expect(mapStatus('Time limit reached')).toBe('time_limit');
  });
  it('Iteration limit reached → iter_limit', () => {
    expect(mapStatus('Iteration limit reached')).toBe('iter_limit');
  });
  it('unknown status → error', () => {
    expect(mapStatus('Something weird')).toBe('error');
    expect(mapStatus('')).toBe('error');
  });
});
