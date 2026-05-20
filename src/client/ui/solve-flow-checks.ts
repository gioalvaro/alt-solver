import type { LinearForm } from '../../shared/linear-form';

/**
 * Inspects an extracted LinearForm and returns the user-facing error
 * message if the LP is degenerate in a way HiGHS will reject — typically
 * because the user's LHS cells contain constants instead of formulas
 * that reference the variable cells.
 *
 * Returns null if the LP is non-empty (at least one objective or row
 * coefficient is materially non-zero).
 *
 * Pulled out of runSolveFlow so it can be unit-tested without mocking
 * the DOM, the RPC bridge, and the modal.
 */
export function emptyLpDiagnostic(lf: LinearForm): string | null {
  const TOL = 1e-12;
  const objHasCoef = lf.objective.coefs.some((c) => Math.abs(c) > TOL);
  const allRowsZero = lf.rows.length > 0 && lf.rows.every(
    (r) => r.coefs.every((c) => Math.abs(c) <= TOL),
  );

  if (!objHasCoef && allRowsZero) {
    return (
      'Ni el objetivo ni las restricciones dependen de las variables. ' +
      'Las celdas LHS (' + lf.rows.map((r) => r.lhsA1).join(', ') +
      ') y la celda objetivo (' + lf.objective.cellA1 + ') probablemente contienen ' +
      'constantes en lugar de fórmulas que multipliquen los coeficientes por las variables. ' +
      'Por ejemplo: =SUMPRODUCT(coeficientes, variables).'
    );
  }
  if (allRowsZero) {
    return (
      'Ninguna de las restricciones depende de las variables. Las celdas ' +
      lf.rows.map((r) => r.lhsA1).join(', ') +
      ' probablemente contienen constantes en lugar de fórmulas. ' +
      'Necesitás fórmulas como =SUMPRODUCT(coeficientes, variables) o =B7*B2 + C7*C2.'
    );
  }
  return null;
}
