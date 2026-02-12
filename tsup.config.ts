import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  target: 'es2020',
  platform: 'browser',
  noExternal: [
    'near-api-js',
    /^@near-js\//,
    'buffer',
    'safe-buffer',
    'randombytes',
    'borsh',
    'bn.js',
    'bs58',
    'base-x',
    'tweetnacl',
    'js-sha256',
    'mustache',
  ],
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'global': 'globalThis',
    }
    options.alias = {
      ...options.alias,
      'http': './src/shims/empty.ts',
      'https': './src/shims/empty.ts',
      'crypto': './src/shims/crypto.ts',
    }
  },
  inject: ['./src/polyfills.ts'],
});