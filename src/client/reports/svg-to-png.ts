/**
 * Converts an SVG string to a base64-encoded PNG using the browser's
 * Canvas + Image APIs.
 *
 * Apps Script sidebars run inside a sandboxed iframe whose CSP often
 * blocks both `blob:` URLs and `data:image/svg+xml;base64,…` URLs from
 * being loaded into <img> elements. The most permissive variant is
 * `data:image/svg+xml;utf8,…` with the SVG payload URI-encoded (not
 * base64). That is what we use here.
 *
 * We render at 1000×750 = 750K pixels because Apps Script's
 * Sheet.insertImage rejects blobs larger than 1M pixels or 2 MB.
 *
 * Returns the base64 PNG payload (no "data:image/png;base64," prefix).
 */
export function svgToPngBase64(svg: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable'));
      return;
    }

    // URI-encode the SVG. encodeURIComponent handles Unicode (·, ≥, ∞, …)
    // correctly and the resulting string is safe to embed in a data URI.
    const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

    const img = new Image();
    img.onload = (): void => {
      try {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const out = canvas.toDataURL('image/png');
        const base64 = out.split(',')[1] ?? '';
        resolve(base64);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = (ev): void => {
      console.error(
        '[AltSolver] img.onerror',
        ev,
        'svg length:', svg.length,
        'data url length:', dataUrl.length,
        'svg head:', svg.slice(0, 120),
        'svg tail:', svg.slice(-80),
      );
      reject(new Error('Image element rejected the SVG payload'));
    };
    img.src = dataUrl;
  });
}
