import type { LinearForm, SolveResult } from '../../shared/linear-form';

/**
 * Renders the feasible region of a 2-variable LP directly to a Canvas
 * and returns it as a base64 PNG.
 *
 * Why not SVG → PNG via <img>?
 *   The HtmlService sidebar's CSP blocks the data:image/svg+xml URLs we
 *   would need to feed into <img> elements. Drawing directly to Canvas
 *   sidesteps that entirely — `canvas.toDataURL('image/png')` is always
 *   allowed because it doesn't load anything from the network.
 *
 * Canvas is rendered at 1000×750 = 750K pixels — comfortably under the
 * 1M-pixel cap that Apps Script imposes on insertImage blobs.
 *
 * Returns null when the model is not a 2-var continuous LP at an
 * optimum (the only case where a 2D plot makes sense).
 */
export function buildGraphicalPng(lf: LinearForm, sr: SolveResult): string | null {
  if (lf.vars.length !== 2 || sr.isMip || sr.status !== 'optimal') return null;
  if (sr.variables.length !== 2) return null;

  const xName = lf.vars[0]!.name;
  const yName = lf.vars[1]!.name;

  // Half-planes (incl. non-negativity for vertex computation only).
  interface HalfPlane { a: number; b: number; rhs: number; op: '<=' | '=' | '>=' }
  const halfPlanes: HalfPlane[] = lf.rows.map((r) => ({
    a: r.coefs[0] ?? 0, b: r.coefs[1] ?? 0, rhs: r.rhs, op: r.op,
  }));
  if (lf.vars[0]!.lower === 0) halfPlanes.push({ a: 1, b: 0, rhs: 0, op: '>=' });
  if (lf.vars[1]!.lower === 0) halfPlanes.push({ a: 0, b: 1, rhs: 0, op: '>=' });

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
  const vertices = dedupe(
    candidates.filter((p) => halfPlanes.every((h) => satisfies(h.a * p.x + h.b * p.y, h.op, h.rhs, 1e-5))),
    1e-5,
  );
  if (vertices.length === 0) return null;
  const cx0 = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
  const cy0 = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;
  vertices.sort((p, q) => Math.atan2(p.y - cy0, p.x - cx0) - Math.atan2(q.y - cy0, q.x - cx0));

  // Axis bounds.
  let xMin = Math.min(0, ...vertices.map((v) => v.x));
  let xMax = Math.max(...vertices.map((v) => v.x));
  let yMin = Math.min(0, ...vertices.map((v) => v.y));
  let yMax = Math.max(...vertices.map((v) => v.y));
  const xPad = (xMax - xMin) * 0.18 || 1;
  const yPad = (yMax - yMin) * 0.18 || 1;
  xMin -= xPad * 0.3; xMax += xPad;
  yMin -= yPad * 0.3; yMax += yPad;

  // Canvas geometry.
  const W = 1000;
  const H = 750;
  const PAD_L = 80;
  const PAD_R = 200; // legend area
  const PAD_T = 60;
  const PAD_B = 70;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const sx = (x: number): number => PAD_L + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number): number => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  const COLORS = ['#1a73e8', '#137333', '#9334E8', '#B06000', '#C5221F', '#00838F'];

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#202124';
  ctx.font = '500 20px "Google Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AltSolver · Solución gráfica', W / 2, 34);

  // Grid
  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);
  ctx.strokeStyle = '#f1f3f4';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    ctx.beginPath();
    ctx.moveTo(sx(x), PAD_T);
    ctx.lineTo(sx(x), PAD_T + plotH);
    ctx.stroke();
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    ctx.beginPath();
    ctx.moveTo(PAD_L, sy(y));
    ctx.lineTo(PAD_L + plotW, sy(y));
    ctx.stroke();
  }

  // Feasible region polygon
  if (vertices.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(sx(vertices[0]!.x), sy(vertices[0]!.y));
    for (let i = 1; i < vertices.length; i++) ctx.lineTo(sx(vertices[i]!.x), sy(vertices[i]!.y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(26,115,232,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(26,115,232,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Real constraint lines (skip non-negativity axes — they coincide with the axes)
  const drawnLines: { name: string; color: string }[] = [];
  lf.rows.forEach((row, idx) => {
    const a = row.coefs[0] ?? 0;
    const b = row.coefs[1] ?? 0;
    const seg = lineSegmentInBox(a, b, row.rhs, xMin, xMax, yMin, yMax);
    if (!seg) return;
    const color = COLORS[idx % COLORS.length]!;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(sx(seg[0].x), sy(seg[0].y));
    ctx.lineTo(sx(seg[1].x), sy(seg[1].y));
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawnLines.push({ name: row.name || `c${idx + 1}`, color });
  });

  // Objective level lines (dashed)
  const c0 = lf.objective.coefs[0] ?? 0;
  const c1 = lf.objective.coefs[1] ?? 0;
  if (Math.abs(c0) + Math.abs(c1) > TOL) {
    const zOpt = sr.objective;
    const levels = [
      { z: zOpt * 0.4, color: '#bdc1c6', dash: [3, 6], width: 1, alpha: 0.6 },
      { z: zOpt * 0.7, color: '#9aa0a6', dash: [3, 6], width: 1, alpha: 0.7 },
      { z: zOpt, color: '#202124', dash: [6, 4], width: 2, alpha: 0.85 },
    ];
    for (const lv of levels) {
      const seg = lineSegmentInBox(c0, c1, lv.z, xMin, xMax, yMin, yMax);
      if (!seg) continue;
      ctx.strokeStyle = lv.color;
      ctx.lineWidth = lv.width;
      ctx.globalAlpha = lv.alpha;
      ctx.setLineDash(lv.dash);
      ctx.beginPath();
      ctx.moveTo(sx(seg[0].x), sy(seg[0].y));
      ctx.lineTo(sx(seg[1].x), sy(seg[1].y));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Vertex dots + labels
  const cVx = vertices.reduce((s, p) => s + p.x, 0) / vertices.length;
  const cVy = vertices.reduce((s, p) => s + p.y, 0) / vertices.length;
  ctx.font = '12px "Google Sans", Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  for (const v of vertices) {
    ctx.fillStyle = '#3c4043';
    ctx.beginPath();
    ctx.arc(sx(v.x), sy(v.y), 4, 0, Math.PI * 2);
    ctx.fill();
    const dx = v.x - cVx;
    const dy = v.y - cVy;
    const norm = Math.hypot(dx, dy) || 1;
    const lx = sx(v.x) + (dx / norm) * 18;
    const ly = sy(v.y) - (dy / norm) * 18;
    ctx.fillStyle = '#5f6368';
    ctx.textAlign = dx >= 0 ? 'left' : 'right';
    ctx.fillText(`(${trimNum(v.x)}, ${trimNum(v.y)})`, lx, ly);
  }

  // Optimum star
  const optX = sr.variables[0]!.primal;
  const optY = sr.variables[1]!.primal;
  drawStar(ctx, sx(optX), sy(optY), 11, '#1a73e8', 'white', 1.8);

  // Optimum label
  const labelOffsetX = optX > (xMin + xMax) / 2 ? -16 : 16;
  const labelOffsetY = optY > (yMin + yMax) / 2 ? 24 : -16;
  ctx.fillStyle = '#1a73e8';
  ctx.font = '500 15px "Google Sans", Arial, sans-serif';
  ctx.textAlign = labelOffsetX > 0 ? 'left' : 'right';
  ctx.fillText(`Óptimo · z = ${trimNum(sr.objective)}`, sx(optX) + labelOffsetX, sy(optY) + labelOffsetY);

  // Axes
  ctx.strokeStyle = '#202124';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD_L, sy(0));
  ctx.lineTo(PAD_L + plotW, sy(0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx(0), PAD_T);
  ctx.lineTo(sx(0), PAD_T + plotH);
  ctx.stroke();

  // Tick labels
  ctx.fillStyle = '#5f6368';
  ctx.font = '12px "Google Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    ctx.fillText(trimNum(x), sx(x), PAD_T + plotH + 22);
  }
  ctx.textAlign = 'right';
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    ctx.fillText(trimNum(y), PAD_L - 10, sy(y) + 4);
  }

  // Axis names
  ctx.fillStyle = '#202124';
  ctx.font = '500 15px "Google Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(xName, PAD_L + plotW / 2, H - 22);
  ctx.save();
  ctx.translate(22, PAD_T + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yName, 0, 0);
  ctx.restore();

  // Legend
  const legendX = PAD_L + plotW + 24;
  let legendY = PAD_T + 8;
  ctx.fillStyle = '#202124';
  ctx.font = '500 13px "Google Sans", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Referencias', legendX, legendY);
  legendY += 22;
  // Feasible region swatch
  ctx.fillStyle = 'rgba(26,115,232,0.14)';
  ctx.fillRect(legendX, legendY - 10, 18, 12);
  ctx.strokeStyle = 'rgba(26,115,232,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(legendX, legendY - 10, 18, 12);
  ctx.fillStyle = '#3c4043';
  ctx.font = '12px "Google Sans", Arial, sans-serif';
  ctx.fillText('Región factible', legendX + 26, legendY);
  legendY += 22;
  // Constraints
  for (const dl of drawnLines) {
    ctx.strokeStyle = dl.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY - 4);
    ctx.lineTo(legendX + 18, legendY - 4);
    ctx.stroke();
    ctx.fillStyle = '#3c4043';
    ctx.fillText(dl.name, legendX + 26, legendY);
    legendY += 20;
  }
  // Optimum
  drawStar(ctx, legendX + 9, legendY - 4, 7, '#1a73e8', 'white', 1.5);
  ctx.fillStyle = '#3c4043';
  ctx.fillText('Óptimo', legendX + 26, legendY);
  legendY += 22;
  // Objective level
  ctx.strokeStyle = '#202124';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(legendX, legendY - 4);
  ctx.lineTo(legendX + 18, legendY - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#3c4043';
  ctx.fillText(`z = ${trimNum(sr.objective)}`, legendX + 26, legendY);

  // Export
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] ?? '';
  return base64;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
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
