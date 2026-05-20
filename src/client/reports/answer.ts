import type { LinearForm, SolveResult, SolveResultRow } from '../../shared/linear-form';

export interface AnswerContext {
  sheetName: string;
  timestamp: string;
}

export function buildAnswerMatrix(
  lf: LinearForm,
  sr: SolveResult,
  ctx: AnswerContext,
): (string | number)[][] {
  const rows: (string | number)[][] = [];

  rows.push(['AltSolver · Informe de Respuesta']);
  rows.push([`Hoja ${ctx.sheetName} · ${ctx.timestamp} · z = ${formatNum(sr.objective)}`]);
  rows.push([]);

  rows.push(['Resumen del solver', '', '', '']);
  rows.push(['Motor', sr.isMip ? 'Simplex + Branch-and-Bound (HiGHS)' : 'Simplex LP (HiGHS)', 'Tiempo', `${sr.time.toFixed(3)} s`]);
  rows.push(['Solución', solutionLabel(sr), 'Iteraciones', sr.iterations]);
  rows.push([]);

  rows.push(['Función objetivo']);
  rows.push(['Celda', 'Nombre', 'Valor inicial', 'Valor final']);
  rows.push([lf.objective.cellA1, lf.objective.name, lf.objective.originalValue, sr.objective]);
  rows.push([]);

  rows.push(['Variables de decisión']);
  rows.push(['Celda', 'Nombre', 'Valor inicial', 'Valor final', 'Tipo']);
  lf.vars.forEach((v, i) => {
    const tipo = v.integral
      ? v.lower === 0 && v.upper === 1
        ? 'Binaria'
        : 'Entera'
      : 'Continua';
    rows.push([v.cellA1, v.name, v.originalValue, sr.variables[i]?.primal ?? 0, tipo]);
  });
  rows.push([]);

  rows.push(['Restricciones']);
  rows.push(['Celda', 'Nombre', 'Valor', 'Fórmula', 'Estado', 'Holgura']);
  lf.rows.forEach((row, j) => {
    const srRow = sr.rows[j];
    const formula = `${row.lhsA1}${row.op}${formatNum(row.rhs)}`;
    const isBinding = bindingTest(srRow);
    const slack = slackValue(row.op, srRow?.primal ?? 0, row.rhs);
    rows.push([
      row.lhsA1,
      row.name,
      srRow?.primal ?? 0,
      formula,
      isBinding ? '● Vinculante' : '○ No vinculante',
      slack,
    ]);
  });

  return rows;
}

function solutionLabel(sr: SolveResult): string {
  switch (sr.status) {
    case 'optimal':
      return 'Óptima';
    case 'time_limit':
      return 'No óptima (tiempo agotado)';
    case 'iter_limit':
      return 'No óptima (iteraciones agotadas)';
    case 'infeasible':
      return 'Infactible';
    case 'unbounded':
      return 'No acotada';
    case 'error':
      return 'Error';
  }
}

function bindingTest(srRow: SolveResultRow | undefined): boolean {
  if (!srRow) return false;
  return srRow.status === 'upper' || srRow.status === 'lower';
}

function slackValue(op: '<=' | '=' | '>=', lhs: number, rhs: number): number {
  if (op === '<=') return rhs - lhs;
  if (op === '>=') return lhs - rhs;
  return Math.abs(lhs - rhs);
}

function formatNum(x: number): string {
  return Number(x.toPrecision(6)).toString();
}
