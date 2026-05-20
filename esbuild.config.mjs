import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

// highs-js uses Node's `fs` and `path` modules inside emscripten glue for the
// node target, but those code paths are dead in a browser context (the loader
// checks `typeof process` etc). Stub them with empty objects so esbuild can
// finish the bundle.
const stubPlugin = {
  name: 'stub-node-builtins',
  setup(build) {
    build.onResolve({ filter: /^(fs|path)$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-builtin',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-builtin' }, () => ({
      contents: 'module.exports = {};',
    }));
  },
};

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
  loader: {
    '.wasm': 'binary',
  },
  plugins: [stubPlugin],
});
