// Inspired by: https://github.com/vuejs/vue-router/blob/dev/build/build.js
const path = require('path')
const fs = require('fs')
const nodeResolve = require('rollup-plugin-node-resolve')
const uglify = require('uglify-js')
const cjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')
const rollup = require('rollup')
const zlib = require('zlib')
const rimraf = require('rimraf')
const prettyBytes = require('pretty-bytes')
const pkg = require('../package.json')

const banner = `// ${pkg.name} v${pkg.version}, Copyright (c) ${new Date().getFullYear()} ${pkg.author}, ${pkg.license}`

rimraf.sync('dist')
fs.mkdirSync('dist')

const isProd = filename => /min\.js$/.test(filename)
const resolve = _path => path.resolve(__dirname, '../', _path)
const relPath = _path => path.relative(process.cwd(), _path)

const uglifyConf = {};

[
  {dest: resolve('dist/mo-query.umd.js'), format: 'umd'},
  {dest: resolve('dist/mo-query.umd.min.js'), format: 'umd'},
  {dest: resolve('dist/mo-query.cjs.js'), format: 'cjs'},
  {dest: resolve('dist/mo-query.esm.js'), format: 'es'}
].map(({dest, format}) => ({
  entry: resolve('src/query.js'), dest, format, moduleName: 'moQuery',
  plugins: [
    nodeResolve(),
    cjs(),
    babel({exclude: 'node_modules/**'})
  ]
})).forEach(c => {
  rollup.rollup(c).then(bundle => bundle.generate(c))
    .then(({code}) => {
      const appendBanner = c => `${banner}\n${c}`

      if(isProd(c.dest)) {
        const uglified = uglify.minify(code, uglifyConf).code
        fs.writeFileSync(c.dest, appendBanner(uglified))

        const zipped = zlib.gzipSync(uglified)

        // eslint-disable-next-line no-console
        console.log(`${relPath(c.dest)} ${prettyBytes(uglified.length)} (gzipped: ${prettyBytes(zipped.length)})`)
      } else {
        fs.writeFileSync(c.dest, appendBanner(code))

        // eslint-disable-next-line no-console
        console.log(`${relPath(c.dest)} ${prettyBytes(code.length)}`)
      }
    }).catch(console.log) // eslint-disable-line no-console
})
