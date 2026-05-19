import type { LinearForm, SolveResult } from '../../shared/linear-form';

/**
 * Structured data describing the 2D LP solution, ready to be written to a
 * sheet and rendered as a native Google Sheets scatter chart by the server.
 *
 * Each series (constraint line, vertex, optimum, objective level line) is a
 * sequence of (x, y) points. The server arranges these points into a single
 * data block with one column per series (offset so that points belonging to
 * different series don't collide) and then builds a scatter chart on top.
 *
 * Returns null when the model is not a 2-variable continuous LP.
 */
export interface GraphicalData {
  xName: string;
  yName: string;
  /** Each constraint line: 2 endpoints clipped to the plot bounds. */
  constraintLines: ConstraintLine[];
  /** Polygon vertices of the feasible region (used for individual points). */
  vertices: Point[];
  /** Optimum point. */
  optimum: { x: number; y: number; z: number };
  /** A few objective level lines (dashed) at z*, z*·0.7, z*·0.4. */
  objectiveLines: { z: number; p1: Point; p2: Point }[];
}

export interface Point { x: number; y: number }
export interface ConstraintLine {
  name: string;
  p1: Point;
  p2: Point;
}

export function buildGraphicalData(lf: LinearForm, sr: SolveResult): GraphicalData | null {
  if (lf.vars.length !== 2 || sr.isMip || sr.status !== 'optimal') return null;
  if (sr.variables.length !== 2) return null;

  const xName = lf.vars[0]!.name;
  const yName = lf.vars[1]!.name;

  interface HalfPlane { a: number; b: number; rhs: number; op: '<=' | '=' | '>=' }

  const halfPlanes: HalfPlane[] = lf.rows.map((r) => ({
    a: r.coefs[0] ?? 0,
    b: r.coefs[1] ?? 0,
    rhs: r.rhs,
    op: r.op,
  }));
  const nonNeg0 = lf.vars[0]!.lower === 0;
  const nonNeg1 = lf.vars[1]!.lower === 0;
  if (nonNeg0) halfPlanes.push({ a: 1, b: 0, rhs: 0, op: '>=' });
  if (nonNeg1) halfPlanes.push({ a: 0, b: 1, rhs: 0, op: '>=' });

  // Vertices = feasible intersections of pairs of constraints.
  const TOL = 1e-7;
  const candidates: Point[] = [];
  for (let i = 0; i < halfPlanes.length; i++) {
    for (let j = i + 1; j < halfPlanes.length; j++) {
      const A = halfPlanes[i]!;
      const B = halfPlanes[j]!;
      const det = A.a * B.b - A.b * B.a;
      if (Math.abs(det) < TOL) continue;
      const x = (A.rhs * B.b - B.rhs * A.b) / det;
      const y = (A.a * B.rhs - B.a * A.rhs) / det;
      if (!isFinite(x) || !isFinite(y)) continue;
      candidates.push({ x, y });
    }
  }
  const vertices = dedupe(
    candidates.filter((p) => halfPlanes.every((h) => satisfies(h.a * p.x + h.b * p.y, h.op, h.rhs, 1e-5))),
    1e-5,
  );
  if (vertices.length === 0) return null;

  // Axis bounds based on vertices, padded.
  const xs = vertices.map((v) => v.x).concat([0]);
  const ys = vertices.map((v) => v.y).concat([0]);
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.15 || 1;
  const yPad = (yMax - yMin) * 0.15 || 1;
  xMin -= xPad * 0.4;
  xMax += xPad;
  yMin -= yPad * 0.4;
  yMax += yPad;

  // Build constraint segments clipped to the box.
  const constraintLines: ConstraintLine[] = [];
  lf.rows.forEach((row, idx) => {
    const a = row.coefs[0] ?? 0;
    const b = row.coefs[1] ?? 0;
    const seg = lineSegmentInBox(a, b, row.rhs, xMin, xMax, yMin, yMax);
    if (seg) {
      constraintLines.push({
        name: row.name || `c${idx + 1}`,
        p1: seg[0],
        p2: seg[1],
      });
    }
  });

  // Objective level lines.
  const c0 = lf.objective.coefs[0] ?? 0;
  const c1 = lf.objective.coefs[1] ?? 0;
  const objectiveLines: { z: number; p1: Point; p2: Point }[] = [];
  if (Math.abs(c0) + Math.abs(c1) > TOL) {
    const zOpt = sr.objective;
    [zOpt * 0.4, zOpt * 0.7, zOpt].forEach((z) => {
      const seg = lineSegmentInBox(c0, c1, z, xMin, xMax, yMin, yMax);
      if (seg) objectiveLines.push({ z, p1: seg[0], p2: seg[1] });
    });
  }

  return {
    xName,
    yName,
    constraintLines,
    vertices,
    optimum: {
      x: sr.variables[0]!.primal,
      y: sr.variables[1]!.primal,
      z: sr.objective,
    },
    objectiveLines,
  };
}

function satisfies(lhs: number, op: '<=' | '=' | '>=', rhs: number, tol: number): boolean {
  if (op === '<=') return lhs <= rhs + tol;
  if (op === '>=') return lhs >= rhs - tol;
  return Math.abs(lhs - rhs) <= tol;
}

function dedupe(vs: Point[], tol: number): Point[] {
  const out: Point[] = [];
  for (const v of vs) {
    if (!out.some((u) => Math.abs(u.x - v.x) < tol && Math.abs(u.y - v.y) < tol)) out.push(v);
  }
  return out;
}

function lineSegmentInBox(
  a: number,
  b: number,
  c: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): [Point, Point] | null {
  const pts: Point[] = [];
  if (Math.abs(b) > 1e-12) {
    const y1 = (c - a * xMin) / b;
    if (y1 >= yMin - 1e-9 && y1 <= yMax + 1e-9) pts.push({ x: xMin, y: y1 });
    const y2 = (c - a * xMax) / b;
    if (y2 >= yMin - 1e-9 && y2 <= yMax + 1e-9) pts.push({ x: xMax, y: y2 });
  }
  if (Math.abs(a) > 1e-12) {
    const x1 = (c - b * yMin) / a;
    if (x1 >= xMin - 1e-9 && x1 <= xMax + 1e-9) pts.push({ x: x1, y: yMin });
    const x2 = (c - b * yMax) / a;
    if (x2 >= xMin - 1e-9 && x2 <= xMax + 1e-9) pts.push({ x: x2, y: yMax });
  }
  const uniq = dedupe(pts, 1e-6);
  if (uniq.length < 2) return null;
  return [uniq[0]!, uniq[uniq.length - 1]!];
}
