// Run small TypeScript modules in Node without a separate test compiler dependency.
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const originalLoad = Module._load
Module._load = function (name, parent, isMain) {
  if (name === 'server-only') return {}
  if (name.startsWith('@/')) name = path.join(__dirname, '..', name.slice(2))
  return originalLoad.call(this, name, parent, isMain)
}
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename)
}
