import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });

// Bundle HTML
const template = readFileSync('src/client/dialog.html.template', 'utf-8');
const bundle = readFileSync('dist/client-bundle.js', 'utf-8');
// Use a function as the replacer so String.prototype.replace does NOT
// interpret $& $` $' $n patterns inside the bundle (the bundle contains
// JS template literals and regexes with backticks/dollar signs).
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
