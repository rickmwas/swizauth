import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  // UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/swizauth.umd.js',
      format: 'umd',
      name: 'SwizAuth',
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
      }
    },
    external: ['react', 'react-dom'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
      }),
      terser()
    ]
  },
  // ES modules build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/swizauth.esm.js',
      format: 'es'
    },
    external: ['react', 'react-dom', 'jwt-decode'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
      })
    ]
  }
];