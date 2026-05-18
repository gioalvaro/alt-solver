import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });

// Bundle HTML
const template = readFileSync('src/client/dialog.html.template', 'utf-8');
const bundle = readFileSync('dist/client-bundle.js', 'utf-8');
const html = template.replace('/* __CLIENT_BUNDLE__ */', bundle);
writeFileSync('dist/dialog.html', html);
console.log(`Built dist/dialog.html (${html.length} bytes)`);

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
