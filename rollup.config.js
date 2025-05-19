import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import buble from '@rollup/plugin-buble'
import replace from '@rollup/plugin-replace'
import path from 'path'
import fs from 'fs'
const dts = require('rollup-plugin-dts')

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function buildBanner(type) {
  return [
    '/*!',
    ` * ${pkg.name} ${type} ${pkg.version}`,
    ` * (c) 2020 - ${new Date().getFullYear()} jackness`,
    ' * Released under the MIT License.',
    ' */'
  ].join('\n')
}

const srcRoot = path.join(__dirname, 'src')
const files = fs.readdirSync(srcRoot).filter((name) => {
  if (path.extname(name) === '.ts') {
    return true
  } else {
    return false
  }
})

export default files.map((filename) => {
  const name = filename.replace(/\.[^.]+$/, '')
  return {
    input: path.join('./src', filename),
    onwarn(warning) {
      if (['CIRCULAR_DEPENDENCY', 'EVAL'].includes(warning.code)) {
        // nothing
      } else {
        console.warn(warning.message)
      }
    },
    output: [
      {
        file: path.join('./output', `${name}.js`),
        format: 'cjs',
        banner: buildBanner('js'),
        exports: 'named',
        sourcemap: false
      },
      {
        file: path.join('./output', `${name}.esm.js`),
        format: 'esm',
        banner: buildBanner('esm'),
        sourcemap: false
      }
    ],
    plugins: [
      nodeResolve({ mainFields: ['module', 'main', 'jsnext:main'] }),
      commonjs({
        include: [/node_modules/, /src\/proto/]
      }),
      json(),
      typescript({
        clean: true,
        typescript: require('typescript')
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.version': `'${pkg.version}'`
        }
      }),
      buble({ objectAssign: 'Object.assign' })
    ].concat(IS_PRODUCTION ? [terser()] : []),
    external: []
  }
})
