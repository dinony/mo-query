const path = require('path')
const SystemJS = require('systemjs')

const resolveNodeModule = mod => `file://${path.resolve(__dirname, '../node_modules', mod)}`
const resolveSrcModule = filename => path.resolve(__dirname, '../src', filename)
const resolveDistModule = filename => path.resolve(__dirname, '../dist', filename)

SystemJS.config({
  map: {
    'plugin-babel': resolveNodeModule('systemjs-plugin-babel/plugin-babel.js'),
    'systemjs-babel-build': resolveNodeModule('systemjs-plugin-babel/systemjs-babel-browser.js')
  },
  transpiler: 'plugin-babel'
})

// Just handle loading of the mo-query lib export
// module.exports = SystemJS.import(resolveDistModule('mo-query.umd.min.js')) // Use dist
module.exports = SystemJS.import(resolveSrcModule('query.js')) // Use src
