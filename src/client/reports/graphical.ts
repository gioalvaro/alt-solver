import type { LinearForm, SolveResult } from '../../shared/linear-form';

/**
 * Generates an SVG plot of the feasible region for a 2-variable LP.
 *
 * Elements:
 *  - Coordinate axes labeled with the two variable names.
 *  - One line per linear constraint (a x1 + b x2 = rhs) clipped to the axes.
 *  - Shaded feasible region (polygon of vertices).
 *  - Each vertex marked with a dot and its (x1, x2) coordinates.
 *  - Three objective level curves at the optimum and below (dashed).
 *  - Optimum point highlighted with a star and "z = …" annotation.
 *
 * Returns null if the model isn't 2-var continuous LP (then the caller skips).
 */
export function buildGraphicalSvg(lf: LinearForm, sr: SolveResult): string | null {
  if (lf.vars.length !== 2 || sr.isMip || sr.status !== 'optimal') return null;
  if (sr.variables.length !== 2) return null;

  const xName = lf.vars[0]!.name;
  const yName = lf.vars[1]!.name;

  // Build half-planes from constraints + non-negativity axes
  type HalfPlane = { a: number; b: number; rhs: number; op: '<=' | '=' | '>='; label: string };

  const halfPlanes: HalfPlane[] = lf.rows.map((r, idx) => ({
    a: r.coefs[0] ?? 0,
    b: r.coefs[1] ?? 0,
    rhs: r.rhs,
    op: r.op,
    label: r.name || `c${idx + 1}`,
  }));

  const nonNeg0 = lf.vars[0]!.lower === 0;
  const nonNeg1 = lf.vars[1]!.lower === 0;
  if (nonNeg0) halfPlanes.push({ a: 1, b: 0, rhs: 0, op: '>=', label: `${xName} ≥ 0` });
  if (nonNeg1) halfPlanes.push({ a: 0, b: 1, rhs: 0, op: '>=', label: `${yName} ≥ 0` });

  // Solve all pairs of binding constraints for candidate vertices.
  const TOL = 1e-7;
  const candidates: { x: number; y: number }[] = [];
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

  // Filter to feasible vertices.
  const vertices = candidates.filter((p) =>
    halfPlanes.every((h) => satisfies(h.a * p.x + h.b * p.y, h.op, h.rhs, 1e-5)),
  );

  if (vertices.length === 0) {
    return svgErrorPlot('Sin vértices factibles; no se puede graficar.');
  }

  // Dedupe (degenerate intersections can produce duplicates).
  const uniqVertices = dedupe(vertices, 1e-5);

  // Order by angle around centroid to form a polygon.
  const cx = uniqVertices.reduce((s, p) => s + p.x, 0) / uniqVertices.length;
  const cy = uniqVertices.reduce((s, p) => s + p.y, 0) / uniqVertices.length;
  uniqVertices.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));

  // Determine axis bounds
  const xVals = uniqVertices.map((v) => v.x);
  const yVals = uniqVertices.map((v) => v.y);
  let xMin = Math.min(0, ...xVals);
  let xMax = Math.max(...xVals);
  let yMin = Math.min(0, ...yVals);
  let yMax = Math.max(...yVals);
  // Pad
  const xPad = (xMax - xMin) * 0.15 || 1;
  const yPad = (yMax - yMin) * 0.15 || 1;
  xMin -= xPad * 0.4;
  xMax += xPad;
  yMin -= yPad * 0.4;
  yMax += yPad;

  // SVG canvas geometry
  const W = 800;
  const H = 600;
  const PAD_L = 70;
  const PAD_R = 30;
  const PAD_T = 50;
  const PAD_B = 60;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const sx = (x: number): number => PAD_L + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number): number => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const COLORS = ['#1a73e8', '#137333', '#9334E8', '#B06000', '#C5221F', '#00838F'];

  const parts: string[] = [];

  // White background
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);

  // Title
  parts.push(
    `<text x="${W / 2}" y="28" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="18" font-weight="500" fill="#202124">AltSolver · Solución gráfica</text>`,
  );

  // Grid (light)
  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    parts.push(`<line x1="${sx(x)}" y1="${PAD_T}" x2="${sx(x)}" y2="${PAD_T + plotH}" stroke="#f1f3f4" stroke-width="1"/>`);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    parts.push(`<line x1="${PAD_L}" y1="${sy(y)}" x2="${PAD_L + plotW}" y2="${sy(y)}" stroke="#f1f3f4" stroke-width="1"/>`);
  }

  // Feasible region polygon
  if (uniqVertices.length >= 3) {
    const polyPts = uniqVertices.map((v) => `${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join(' ');
    parts.push(
      `<polygon points="${polyPts}" fill="rgba(26,115,232,0.10)" stroke="rgba(26,115,232,0.4)" stroke-width="1"/>`,
    );
  }

  // Constraint lines
  halfPlanes.forEach((h, idx) => {
    // Find line endpoints within the axis box: a*x + b*y = rhs
    const pts = lineSegmentInBox(h.a, h.b, h.rhs, xMin, xMax, yMin, yMax);
    if (!pts) return;
    const color = COLORS[idx % COLORS.length]!;
    const [p1, p2] = pts;
    parts.push(
      `<line x1="${sx(p1.x).toFixed(1)}" y1="${sy(p1.y).toFixed(1)}" x2="${sx(p2.x).toFixed(1)}" y2="${sy(p2.y).toFixed(1)}" stroke="${color}" stroke-width="2" stroke-opacity="0.75"/>`,
    );
    // Label near second endpoint, slightly offset
    const labelX = sx(p2.x) + 4;
    const labelY = sy(p2.y) - 4;
    parts.push(
      `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" font-family="Google Sans, Arial, sans-serif" font-size="11" fill="${color}">${escapeSvg(h.label)}</text>`,
    );
  });

  // Objective level curves (dashed) — perpendicular to gradient (c0, c1).
  const c0 = lf.objective.coefs[0] ?? 0;
  const c1 = lf.objective.coefs[1] ?? 0;
  if (Math.abs(c0) + Math.abs(c1) > TOL) {
    const zOpt = sr.objective;
    const levels = [zOpt * 0.4, zOpt * 0.7, zOpt];
    levels.forEach((z, idx) => {
      const pts = lineSegmentInBox(c0, c1, z, xMin, xMax, yMin, yMax);
      if (!pts) return;
      const [p1, p2] = pts;
      const isOpt = idx === levels.length - 1;
      parts.push(
        `<line x1="${sx(p1.x).toFixed(1)}" y1="${sy(p1.y).toFixed(1)}" x2="${sx(p2.x).toFixed(1)}" y2="${sy(p2.y).toFixed(1)}" stroke="#5f6368" stroke-width="${isOpt ? 1.8 : 1}" stroke-dasharray="${isOpt ? '4,3' : '2,4'}" stroke-opacity="${isOpt ? 0.85 : 0.4}"/>`,
      );
    });
  }

  // Vertex dots + labels
  uniqVertices.forEach((v) => {
    parts.push(
      `<circle cx="${sx(v.x).toFixed(1)}" cy="${sy(v.y).toFixed(1)}" r="3.5" fill="#5f6368"/>`,
    );
    parts.push(
      `<text x="${(sx(v.x) + 6).toFixed(1)}" y="${(sy(v.y) - 6).toFixed(1)}" font-family="Google Sans, Arial, sans-serif" font-size="10" fill="#5f6368">(${trimNum(v.x)}, ${trimNum(v.y)})</text>`,
    );
  });

  // Optimum point
  const optX = sr.variables[0]!.primal;
  const optY = sr.variables[1]!.primal;
  parts.push(starPath(sx(optX), sy(optY), 8, '#1a73e8'));
  parts.push(
    `<text x="${(sx(optX) + 12).toFixed(1)}" y="${(sy(optY) - 8).toFixed(1)}" font-family="Google Sans, Arial, sans-serif" font-size="13" font-weight="500" fill="#1a73e8">Óptimo · z = ${trimNum(sr.objective)}</text>`,
  );

  // Axes drawn last
  parts.push(`<line x1="${PAD_L}" y1="${PAD_T + plotH}" x2="${PAD_L + plotW}" y2="${PAD_T + plotH}" stroke="#202124" stroke-width="1.5"/>`);
  parts.push(`<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + plotH}" stroke="#202124" stroke-width="1.5"/>`);

  // Axis tick labels
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    parts.push(
      `<text x="${sx(x).toFixed(1)}" y="${(PAD_T + plotH + 18).toFixed(1)}" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="11" fill="#5f6368">${trimNum(x)}</text>`,
    );
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    parts.push(
      `<text x="${(PAD_L - 8).toFixed(1)}" y="${(sy(y) + 4).toFixed(1)}" text-anchor="end" font-family="Google Sans, Arial, sans-serif" font-size="11" fill="#5f6368">${trimNum(y)}</text>`,
    );
  }

  // Axis names
  parts.push(
    `<text x="${(PAD_L + plotW + 4).toFixed(1)}" y="${(PAD_T + plotH + 5).toFixed(1)}" font-family="Google Sans, Arial, sans-serif" font-size="13" font-weight="500" fill="#202124">${escapeSvg(xName)}</text>`,
  );
  parts.push(
    `<text x="${PAD_L - 4}" y="${PAD_T - 8}" text-anchor="end" font-family="Google Sans, Arial, sans-serif" font-size="13" font-weight="500" fill="#202124">${escapeSvg(yName)}</text>`,
  );

  return wrapSvg(W, H, parts.join('\n'));
}

function wrapSvg(w: number, h: number, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${body}
</svg>`;
}

function svgErrorPlot(msg: string): string {
  return wrapSvg(800, 200, `<text x="400" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#C5221F">${escapeSvg(msg)}</text>`);
}

function satisfies(lhs: number, op: '<=' | '=' | '>=', rhs: number, tol: number): boolean {
  if (op === '<=') return lhs <= rhs + tol;
  if (op === '>=') return lhs >= rhs - tol;
  return Math.abs(lhs - rhs) <= tol;
}

function dedupe(vs: { x: number; y: number }[], tol: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const v of vs) {
    if (!out.some((u) => Math.abs(u.x - v.x) < tol && Math.abs(u.y - v.y) < tol)) {
      out.push(v);
    }
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
): [{ x: number; y: number }, { x: number; y: number }] | null {
  // Intersect line a*x + b*y = c with the box [xMin, xMax] x [yMin, yMax]
  const pts: { x: number; y: number }[] = [];
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
  if (pts.length < 2) return null;
  // Dedupe and pick the two extremes
  const uniq = dedupe(pts, 1e-6);
  if (uniq.length < 2) return null;
  return [uniq[0]!, uniq[uniq.length - 1]!];
}

function starPath(cx: number, cy: number, r: number, color: string): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${color}" stroke="white" stroke-width="1.5"/>`;
}

function niceStep(range: number): number {
  if (range <= 0 || !isFinite(range)) return 1;
  const rough = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

function trimNum(x: number): string {
  if (Math.abs(x) < 1e-9) return '0';
  return Number(x.toPrecision(4)).toString();
}

function escapeSvg(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
