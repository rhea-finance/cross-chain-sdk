import { defineConfig } from 'tsup';

export default defineConfig({
  // entry file
  entry: ['src/index.ts'],
  
  // output format: CommonJS + ES Modules
  format: ['cjs', 'esm'],
  
  // generate TypeScript type definition file
  dts: true,
  
  // code splitting (SDK usually set to false)
  splitting: false,
  
  // generate source map
  sourcemap: true,
  
  // clean dist directory before building
  clean: true,
  
  // Tree-shaking optimization
  treeshake: true,
  
  // whether to compress (false for development, true for production)
  minify: false,
  
  
  // output directory
  outDir: 'dist',
  
  // compile target version
  target: 'es2020',
});