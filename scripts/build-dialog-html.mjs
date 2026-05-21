import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });

// Bundle HTML
const template = readFileSync('src/client/dialog.html.template', 'utf-8');
const bundle = readFileSync('dist/client-bundle.js', 'utf-8');

// Publish the bundle on GitHub Pages instead of inlining it. Apps Script's
// HtmlService runs a textual processor on inline scripts that mangles `//`
// inside strings and truncates content above ~150KB; loading the bundle as
// an external <script src> sidesteps all of that. The HTML loader is tiny
// and harmless to inline.
const bundleHash = createHash('sha256').update(bundle).digest('hex').slice(0, 12);
mkdirSync('docs', { recursive: true });
writeFileSync('docs/client-bundle.js', bundle);
console.log(`Published docs/client-bundle.js (${bundle.length} bytes, hash ${bundleHash})`);

const html = template.replace('__BUNDLE_HASH__', () => bundleHash);
writeFileSync('dist/dialog.html', html);
console.log(`Built dist/dialog.html (${html.length} bytes)`);

// Remove the intermediate JS bundle from dist so clasp doesn't try to upload
// it as .gs. The bundle is fetched from GitHub Pages at runtime.
rmSync('dist/client-bundle.js', { force: true });

// Copy .gs files
if (existsSync('src/server')) {
  const serverFiles = readdirSync('src/server').filter((f) => f.endsWith('.gs'));
  for (const f of serverFiles) {
    cpSync(join('src/server', f), join('dist', f));
  }
  console.log(`Copied ${serverFiles.length} .gs files to dist/`);
}

// Copy manifest
cpSync('appsscript.json', 'dist/appsscript.json');
console.log(`Copied appsscript.json to dist/`);
