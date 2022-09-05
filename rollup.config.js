import path from 'path';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import tscompile from 'typescript';
import alias from "@rollup/plugin-alias";
import { uglify } from 'rollup-plugin-uglify';

const isDev = process.env.NODE_ENV !== 'production';

const identity = _ => _;

export default {
  input: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    name: 'FdFeMonitor',
    file: path.resolve(__dirname, isDev ? './website/lib/fd-fe-monitor-sdk/fd-fe-monitor-sdk.bundle.js' : 'dist/fd-fe-monitor-sdk.min.js'),
    format: 'umd',
    sourcemap: true
  },
  global: {
    localforage: 'localforage'
  },
  // external: ['localforage'],
  watch: {
    exclude: 'node_modules/**'
  },
  plugins: [
    !isDev && uglify(),
    alias({
      resolve: ['.js', '.ts'],
      entries: {
        '@': './src',
        'utils': './src/utils'
      },
    }),
    commonjs(),
    resolve({
      // 将自定义选项传递给解析插件
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    }),
    typescript({ typescript: tscompile }),
  ]
}
