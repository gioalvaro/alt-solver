import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });

// Bundle HTML
const template = readFileSync('src/client/dialog.html.template', 'utf-8');
let bundle = readFileSync('dist/client-bundle.js', 'utf-8');

// Apps Script's HtmlService runs a minifier on inline scripts that strips
// // ... to end-of-line WITHOUT understanding string context — so any `//`
// inside a string literal (e.g. "https://...", "file://", "http://...")
// gets eaten and the resulting unclosed string blows up the parser.
// Workaround: rewrite every JS string literal so that `//` is encoded as
// `//`. The runtime value of the string is identical, but
// Apps Script's textual scanner doesn't see two consecutive `/` characters
// anymore.
const STRING_LITERAL_RE = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
bundle = bundle.replace(STRING_LITERAL_RE, (lit) => lit.replaceAll('//', '\\u002F\\u002F'));

const html = template.replace('/* __CLIENT_BUNDLE__ */', () => bundle);
writeFileSync('dist/dialog.html', html);
console.log(`Built dist/dialog.html (${html.length} bytes)`);

// Remove the intermediate JS bundle so clasp doesn't try to upload it as .gs.
// The bundle is already inlined in dialog.html.
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
