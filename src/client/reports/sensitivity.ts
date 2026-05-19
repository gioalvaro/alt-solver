import type { LinearForm, SolveResult } from '../../shared/linear-form';
import type { AnswerContext } from './answer';

export function buildSensitivityMatrix(
  lf: LinearForm,
  sr: SolveResult,
  ctx: AnswerContext,
): (string | number)[][] | null {
  if (sr.isMip) return null;

  const rows: (string | number)[][] = [];

  rows.push(['AltSolver · Informe de Sensibilidad']);
  rows.push([`Hoja ${ctx.sheetName} · ${ctx.timestamp} · z = ${formatNum(sr.objective)}`]);
  rows.push([]);

  rows.push(['Variables de decisión']);
  rows.push(['Celda', 'Nombre', 'Valor final', 'Costo reducido', 'Coef. objetivo', 'Incremento admisible', 'Decremento admisible']);
  lf.vars.forEach((v, i) => {
    const sv = sr.variables[i];
    rows.push([
      v.cellA1,
      v.name,
      sv?.primal ?? 0,
      sv?.dual ?? 0,
      lf.objective.coefs[i] ?? 0,
      sv?.rangeUp === null || sv?.rangeUp === undefined ? '∞' : sv.rangeUp,
      sv?.rangeDown === null || sv?.rangeDown === undefined ? '∞' : sv.rangeDown,
    ]);
  });
  rows.push([]);

  rows.push(['Restricciones']);
  rows.push(['Celda', 'Nombre', 'Valor final', 'Precio sombra', 'Lado derecho', 'Incremento admisible', 'Decremento admisible']);
  lf.rows.forEach((row, j) => {
    const sRow = sr.rows[j];
    rows.push([
      row.lhsA1,
      row.name,
      sRow?.primal ?? 0,
      sRow?.dual ?? 0,
      row.rhs,
      sRow?.rangeUp === null || sRow?.rangeUp === undefined ? '∞' : sRow.rangeUp,
      sRow?.rangeDown === null || sRow?.rangeDown === undefined ? '∞' : sRow.rangeDown,
    ]);
  });

  return rows;
}

function formatNum(x: number): string {
  return Number(x.toPrecision(6)).toString();
}
