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

// `highs/runtime` resolves to highs.wasm inside the package. We don't want
// the binary embedded in the bundle anymore (Apps Script truncates inline
// content over ~150KB) — replace any import of the WASM with an empty
// Uint8Array placeholder. The actual WASM is fetched at runtime from
// GitHub Pages in src/client/solver/highs-loader.ts.
const stubWasmPlugin = {
  name: 'stub-wasm-runtime',
  setup(build) {
    build.onResolve({ filter: /^highs\/runtime$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-wasm',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-wasm' }, () => ({
      contents: 'export default new Uint8Array(0);',
      loader: 'js',
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
  plugins: [stubPlugin, stubWasmPlugin],
});
