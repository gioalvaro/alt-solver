import type { LinearForm, SolveResult } from '../../shared/linear-form';

/**
 * Generates an SVG plot of the feasible region for a 2-variable LP.
 *
 * Elements:
 *  - Coordinate axes with tick labels and variable names.
 *  - One line per *real* linear constraint (skipping the non-negativity
 *    constraints since those coincide with the axes already drawn).
 *  - Shaded feasible region polygon (light blue).
 *  - Each vertex marked with a small dot and its (x, y) coordinate label
 *    placed away from the polygon interior.
 *  - Three dashed objective level lines: at z = z* (bold black), at the
 *    midpoint and a lower value (faint grey).
 *  - Optimum point as a large blue star with "Óptimo · z = N" label
 *    placed in the corner farthest from the polygon to avoid overlap.
 *
 * Returns null if the model is not a 2-var continuous optimum LP.
 */
export function buildGraphicalSvg(lf: LinearForm, sr: SolveResult): string | null {
  if (lf.vars.length !== 2 || sr.isMip || sr.status !== 'optimal') return null;
  if (sr.variables.length !== 2) return null;

  const xName = lf.vars[0]!.name;
  const yName = lf.vars[1]!.name;

  // Half-planes for vertex computation (includes non-negativity bounds).
  interface HalfPlane { a: number; b: number; rhs: number; op: '<=' | '=' | '>='; label: string; isAxis: boolean }
  const halfPlanes: HalfPlane[] = lf.rows.map((r, idx) => ({
    a: r.coefs[0] ?? 0,
    b: r.coefs[1] ?? 0,
    rhs: r.rhs,
    op: r.op,
    label: r.name || `c${idx + 1}`,
    isAxis: false,
  }));
  const nonNeg0 = lf.vars[0]!.lower === 0;
  const nonNeg1 = lf.vars[1]!.lower === 0;
  if (nonNeg0) halfPlanes.push({ a: 1, b: 0, rhs: 0, op: '>=', label: '', isAxis: true });
  if (nonNeg1) halfPlanes.push({ a: 0, b: 1, rhs: 0, op: '>=', label: '', isAxis: true });

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
  const vertices = candidates.filter((p) =>
    halfPlanes.every((h) => satisfies(h.a * p.x + h.b * p.y, h.op, h.rhs, 1e-5)),
  );
  if (vertices.length === 0) return svgErrorPlot('Sin vértices factibles; no se puede graficar.');
  const uniqVertices = dedupe(vertices, 1e-5);
  const cx0 = uniqVertices.reduce((s, p) => s + p.x, 0) / uniqVertices.length;
  const cy0 = uniqVertices.reduce((s, p) => s + p.y, 0) / uniqVertices.length;
  uniqVertices.sort((p, q) => Math.atan2(p.y - cy0, p.x - cx0) - Math.atan2(q.y - cy0, q.x - cx0));

  // Axis bounds.
  const xVals = uniqVertices.map((v) => v.x);
  const yVals = uniqVertices.map((v) => v.y);
  let xMin = Math.min(0, ...xVals);
  let xMax = Math.max(...xVals);
  let yMin = Math.min(0, ...yVals);
  let yMax = Math.max(...yVals);
  const xPad = (xMax - xMin) * 0.18 || 1;
  const yPad = (yMax - yMin) * 0.18 || 1;
  xMin -= xPad * 0.3;
  xMax += xPad;
  yMin -= yPad * 0.3;
  yMax += yPad;

  // SVG canvas — sized so the rendered PNG (same dims) stays under
  // Apps Script's 1 M-pixel limit for insertImage. 1000 × 750 = 750 K px.
  const W = 1000;
  const H = 750;
  const PAD_L = 80;
  const PAD_R = 200; // room for legend
  const PAD_T = 60;
  const PAD_B = 70;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const sx = (x: number): number => PAD_L + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number): number => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const COLORS = ['#1a73e8', '#137333', '#9334E8', '#B06000', '#C5221F', '#00838F'];
  const parts: string[] = [];

  // Background
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);

  // Title
  parts.push(
    `<text x="${W / 2}" y="34" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="20" font-weight="500" fill="#202124">AltSolver · Solución gráfica</text>`,
  );

  // Grid
  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    parts.push(`<line x1="${sx(x)}" y1="${PAD_T}" x2="${sx(x)}" y2="${PAD_T + plotH}" stroke="#f1f3f4" stroke-width="1"/>`);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    parts.push(`<line x1="${PAD_L}" y1="${sy(y)}" x2="${PAD_L + plotW}" y2="${sy(y)}" stroke="#f1f3f4" stroke-width="1"/>`);
  }

  // Feasible region
  if (uniqVertices.length >= 3) {
    const polyPts = uniqVertices.map((v) => `${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`).join(' ');
    parts.push(
      `<polygon points="${polyPts}" fill="rgba(26,115,232,0.14)" stroke="rgba(26,115,232,0.45)" stroke-width="1.5"/>`,
    );
  }

  // Real constraint lines (skip non-negativity axes — they coincide with the axes)
  const drawnLines: { name: string; color: string }[] = [];
  lf.rows.forEach((row, idx) => {
    const a = row.coefs[0] ?? 0;
    const b = row.coefs[1] ?? 0;
    const seg = lineSegmentInBox(a, b, row.rhs, xMin, xMax, yMin, yMax);
    if (!seg) return;
    const color = COLORS[idx % COLORS.length]!;
    const [p1, p2] = seg;
    parts.push(
      `<line x1="${sx(p1.x).toFixed(1)}" y1="${sy(p1.y).toFixed(1)}" x2="${sx(p2.x).toFixed(1)}" y2="${sy(p2.y).toFixed(1)}" stroke="${color}" stroke-width="2.5" stroke-opacity="0.85"/>`,
    );
    drawnLines.push({ name: row.name || `c${idx + 1}`, color });
  });

  // Objective level lines
  const c0 = lf.objective.coefs[0] ?? 0;
  const c1 = lf.objective.coefs[1] ?? 0;
  if (Math.abs(c0) + Math.abs(c1) > TOL) {
    const zOpt = sr.objective;
    const levels = [
      { z: zOpt * 0.4, color: '#bdc1c6', dash: '3,6', width: 1, opacity: 0.6 },
      { z: zOpt * 0.7, color: '#9aa0a6', dash: '3,6', width: 1, opacity: 0.7 },
      { z: zOpt, color: '#202124', dash: '6,4', width: 2, opacity: 0.85 },
    ];
    levels.forEach((lv) => {
      const seg = lineSegmentInBox(c0, c1, lv.z, xMin, xMax, yMin, yMax);
      if (!seg) return;
      const [p1, p2] = seg;
      parts.push(
        `<line x1="${sx(p1.x).toFixed(1)}" y1="${sy(p1.y).toFixed(1)}" x2="${sx(p2.x).toFixed(1)}" y2="${sy(p2.y).toFixed(1)}" stroke="${lv.color}" stroke-width="${lv.width}" stroke-dasharray="${lv.dash}" stroke-opacity="${lv.opacity}"/>`,
      );
    });
  }

  // Vertex dots — label placement: push label outward from polygon centroid
  const cVx = uniqVertices.reduce((s, p) => s + p.x, 0) / uniqVertices.length;
  const cVy = uniqVertices.reduce((s, p) => s + p.y, 0) / uniqVertices.length;
  uniqVertices.forEach((v) => {
    parts.push(`<circle cx="${sx(v.x).toFixed(1)}" cy="${sy(v.y).toFixed(1)}" r="4" fill="#3c4043"/>`);
    const dx = v.x - cVx;
    const dy = v.y - cVy;
    const norm = Math.hypot(dx, dy) || 1;
    const lx = sx(v.x) + (dx / norm) * 18;
    const ly = sy(v.y) - (dy / norm) * 18;
    const anchor = dx >= 0 ? 'start' : 'end';
    parts.push(
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#5f6368">(${trimNum(v.x)}, ${trimNum(v.y)})</text>`,
    );
  });

  // Optimum
  const optX = sr.variables[0]!.primal;
  const optY = sr.variables[1]!.primal;
  parts.push(starPath(sx(optX), sy(optY), 11, '#1a73e8'));
  // Label placement: pick a quadrant offset that keeps the text inside the plot
  const labelOffsetX = optX > (xMin + xMax) / 2 ? -16 : 16;
  const labelOffsetY = optY > (yMin + yMax) / 2 ? 24 : -16;
  const labelAnchor = labelOffsetX > 0 ? 'start' : 'end';
  parts.push(
    `<text x="${(sx(optX) + labelOffsetX).toFixed(1)}" y="${(sy(optY) + labelOffsetY).toFixed(1)}" text-anchor="${labelAnchor}" font-family="Google Sans, Arial, sans-serif" font-size="15" font-weight="500" fill="#1a73e8">Óptimo · z = ${trimNum(sr.objective)}</text>`,
  );

  // Axes (drawn after data so they appear on top of grid)
  parts.push(`<line x1="${PAD_L}" y1="${sy(0).toFixed(1)}" x2="${PAD_L + plotW}" y2="${sy(0).toFixed(1)}" stroke="#202124" stroke-width="1.5"/>`);
  parts.push(`<line x1="${sx(0).toFixed(1)}" y1="${PAD_T}" x2="${sx(0).toFixed(1)}" y2="${PAD_T + plotH}" stroke="#202124" stroke-width="1.5"/>`);

  // Tick labels
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    parts.push(
      `<text x="${sx(x).toFixed(1)}" y="${(PAD_T + plotH + 22).toFixed(1)}" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#5f6368">${trimNum(x)}</text>`,
    );
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    parts.push(
      `<text x="${(PAD_L - 10).toFixed(1)}" y="${(sy(y) + 4).toFixed(1)}" text-anchor="end" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#5f6368">${trimNum(y)}</text>`,
    );
  }

  // Axis names
  parts.push(
    `<text x="${(PAD_L + plotW / 2).toFixed(1)}" y="${(H - 22).toFixed(1)}" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="15" font-weight="500" fill="#202124">${escapeSvg(xName)}</text>`,
  );
  parts.push(
    `<text transform="rotate(-90)" x="${-(PAD_T + plotH / 2).toFixed(1)}" y="22" text-anchor="middle" font-family="Google Sans, Arial, sans-serif" font-size="15" font-weight="500" fill="#202124">${escapeSvg(yName)}</text>`,
  );

  // Legend (right side)
  const legendX = PAD_L + plotW + 24;
  let legendY = PAD_T + 8;
  parts.push(
    `<text x="${legendX}" y="${legendY}" font-family="Google Sans, Arial, sans-serif" font-size="13" font-weight="500" fill="#202124">Referencias</text>`,
  );
  legendY += 22;
  // Feasible region
  parts.push(
    `<rect x="${legendX}" y="${legendY - 10}" width="18" height="12" fill="rgba(26,115,232,0.14)" stroke="rgba(26,115,232,0.5)"/>`,
  );
  parts.push(
    `<text x="${legendX + 26}" y="${legendY}" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#3c4043">Región factible</text>`,
  );
  legendY += 22;
  // Constraint lines
  drawnLines.forEach((dl) => {
    parts.push(`<line x1="${legendX}" y1="${legendY - 4}" x2="${legendX + 18}" y2="${legendY - 4}" stroke="${dl.color}" stroke-width="2.5"/>`);
    parts.push(`<text x="${legendX + 26}" y="${legendY}" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#3c4043">${escapeSvg(dl.name)}</text>`);
    legendY += 20;
  });
  // Optimum
  parts.push(starPath(legendX + 9, legendY - 4, 7, '#1a73e8'));
  parts.push(
    `<text x="${legendX + 26}" y="${legendY}" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#3c4043">Óptimo</text>`,
  );
  legendY += 22;
  // Objective level
  parts.push(`<line x1="${legendX}" y1="${legendY - 4}" x2="${legendX + 18}" y2="${legendY - 4}" stroke="#202124" stroke-width="2" stroke-dasharray="6,4"/>`);
  parts.push(
    `<text x="${legendX + 26}" y="${legendY}" font-family="Google Sans, Arial, sans-serif" font-size="12" fill="#3c4043">z = ${trimNum(sr.objective)}</text>`,
  );

  return wrapSvg(W, H, parts.join('\n'));
}

function wrapSvg(w: number, h: number, body: string): string {
  // No <?xml?> declaration on purpose — Image elements in some sandboxed
  // contexts refuse SVGs that start with the XML prolog.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
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
): [{ x: number; y: number }, { x: number; y: number }] | null {
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
  return `<polygon points="${points.join(' ')}" fill="${color}" stroke="white" stroke-width="1.8"/>`;
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
