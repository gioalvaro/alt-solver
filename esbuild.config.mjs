import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'firefox100', 'safari15'],
  platform: 'browser',
  minify: false,
  sourcemap: false,
  outfile: 'dist/client-bundle.js',
  legalComments: 'none',
  logLevel: 'info',
});
