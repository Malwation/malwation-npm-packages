import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const common = {
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'VizEngine',
  target: ['es2020'],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  logLevel: 'info',
};

await build({ ...common, outfile: 'dist/vizengine.js' });
await build({ ...common, outfile: 'dist/vizengine.min.js', minify: true });
