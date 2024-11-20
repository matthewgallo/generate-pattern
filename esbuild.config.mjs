import * as esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

await esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    platform: 'node',
    format: 'esm',
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
