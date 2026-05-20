import type { LinearForm } from '../../shared/linear-form';

/**
 * Translates a LinearForm into HiGHS's LP file format string.
 *
 * Format reference: standard LP file format (CPLEX/Gurobi syntax).
 *
 * Variable naming: uses sanitized LinearForm names (alphanumeric + underscore).
 * If the inferred name has invalid chars, we fall back to x_i.
 */
export function toLpFormat(lf: LinearForm): string {
  const sanitizedNames = lf.vars.map((v, i) => safeName(v.name, i));

  const lines: string[] = [];

  lines.push(lf.objective.sense === 'MAX' ? 'Maximize' : 'Minimize');
  lines.push(' obj: ' + writeLinearExpr(lf.objective.coefs, sanitizedNames));

  lines.push('Subject To');
  lf.rows.forEach((row, idx) => {
    const expr = writeLinearExpr(row.coefs, sanitizedNames);
    const opStr = row.op === '=' ? '=' : row.op;
    lines.push(` c${idx + 1}: ${expr} ${opStr} ${formatNumber(row.rhs)}`);
  });

  // Bounds (only non-default).
  // The server returns 1e30 / -1e30 as sentinel "infinity" (Apps Script's
  // RPC serializes real Infinity/NaN as null). Treat |x| >= 1e30 as ∞.
  const INF = 1e30;
  const isPosInf = (x: number): boolean => x === Infinity || x >= INF;
  const isNegInf = (x: number): boolean => x === -Infinity || x <= -INF;

  const boundLines: string[] = [];
  lf.vars.forEach((v, i) => {
    const name = sanitizedNames[i]!;
    if (isNegInf(v.lower) && isPosInf(v.upper)) {
      boundLines.push(` ${name} free`);
      return;
    }
    if (v.lower !== 0) {
      if (isNegInf(v.lower)) boundLines.push(` -inf <= ${name}`);
      else boundLines.push(` ${formatNumber(v.lower)} <= ${name}`);
    }
    if (!isPosInf(v.upper)) {
      boundLines.push(` ${name} <= ${formatNumber(v.upper)}`);
    }
  });
  if (boundLines.length > 0) {
    lines.push('Bounds');
    lines.push(...boundLines);
  }

  // Binary (integral + 0..1)
  const binaries = lf.vars
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.integral && v.lower === 0 && v.upper === 1)
    .map(({ i }) => sanitizedNames[i]!);
  if (binaries.length > 0) {
    lines.push('Binary');
    lines.push(' ' + binaries.join(' '));
  }

  // General (integer but not binary)
  const generals = lf.vars
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.integral && !(v.lower === 0 && v.upper === 1))
    .map(({ i }) => sanitizedNames[i]!);
  if (generals.length > 0) {
    lines.push('General');
    lines.push(' ' + generals.join(' '));
  }

  lines.push('End');
  return lines.join('\n');
}

function writeLinearExpr(coefs: number[], names: string[]): string {
  const terms: string[] = [];
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const name = names[i]!;
    if (terms.length === 0) {
      terms.push(`${formatNumber(c)} ${name}`);
    } else {
      const sign = c >= 0 ? '+' : '-';
      terms.push(`${sign} ${formatNumber(Math.abs(c))} ${name}`);
    }
  });
  return terms.length === 0 ? '0' : terms.join(' ');
}

function formatNumber(x: number): string {
  if (!isFinite(x)) return x > 0 ? '+inf' : '-inf';
  return Number(x.toPrecision(15)).toString();
}

const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
function safeName(name: string, index: number): string {
  if (VALID_NAME.test(name)) return name;
  return `x_${index + 1}`;
}
