/**
 * Converts an SVG string to a base64-encoded PNG using the browser's
 * Canvas + Image APIs.
 *
 * Apps Script's Utilities.newBlob(svg).getAs('image/png') does NOT
 * actually convert SVG to PNG (the conversion is rejected). Apps Script
 * also rejects blobs larger than 2 MB or 1M pixels for insertImage, so
 * we render at 1000×750 = 750K pixels — comfortably under both limits.
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

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = (): void => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1] ?? '';
        resolve(base64);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = (): void => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into Image element'));
    };
    img.src = url;
  });
}
