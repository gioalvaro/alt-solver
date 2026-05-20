/**
 * Converts an SVG string to a base64-encoded PNG using the browser's
 * Canvas + Image APIs.
 *
 * Apps Script's Utilities.newBlob(svg).getAs('image/png') does NOT
 * actually convert SVG to PNG (the conversion is rejected). Apps Script
 * also rejects blobs larger than 2 MB or 1M pixels for insertImage, so
 * we render at 1000×750 = 750K pixels — comfortably under both limits.
 *
 * Implementation note: HtmlService sidebars use a CSP that blocks
 * loading `blob:` URLs into <img>. We use a `data:image/svg+xml;base64`
 * URL instead, which is allowed.
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

    // UTF-8 safe base64 encode (btoa requires latin-1 input).
    let base64Svg: string;
    try {
      base64Svg = utf8ToBase64(svg);
    } catch (e) {
      reject(new Error('Could not base64-encode SVG: ' + (e as Error).message));
      return;
    }
    const dataUrl = 'data:image/svg+xml;base64,' + base64Svg;

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
      // ev is usually a generic Event with no detail. Capture what we can.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (ev as any)?.message || 'Image element rejected the SVG payload';
      console.error('[AltSolver] img.onerror', ev, 'SVG length:', svg.length, 'first 200 chars:', svg.slice(0, 200));
      reject(new Error(msg));
    };
    img.src = dataUrl;
  });
}

/**
 * btoa-safe encoding for strings that may contain code points > 0xFF.
 * The classic encodeURIComponent + unescape trick is deprecated in modern
 * JS, so we go through a TextEncoder when available.
 */
function utf8ToBase64(s: string): string {
  if (typeof TextEncoder !== 'undefined') {
    const bytes = new TextEncoder().encode(s);
    let binary = '';
    // Convert byte array to binary string in chunks to avoid call stack issues.
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
  }
  // Fallback for very old engines.
  return btoa(unescape(encodeURIComponent(s)));
}
