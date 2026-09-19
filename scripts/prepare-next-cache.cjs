// Keep generated Next.js files out of OneDrive's cloud reparse points on Windows.
// Other machines and deployed builds continue to use the normal .next directory.
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { createHash } = require('node:crypto')

const project = path.resolve(__dirname, '..')
if (process.platform === 'win32' && /[\\/]OneDrive(?:[^\\/]*)[\\/]/i.test(project)) {
  const id = createHash('sha256').update(project.toLowerCase()).digest('hex').slice(0, 16)
  const legacyCache = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Aabroze', 'next-cache', id)
  const runtime = `${legacyCache}-runtime`
  const cache = path.join(runtime, '.next')
  const output = path.join(project, '.next')
  fs.mkdirSync(cache, { recursive: true })
  // Node resolves generated server imports from the junction's real location.
  // Keep dependencies in its parent so Next's output cleanup cannot remove them.
  const dependencies = path.join(runtime, 'node_modules')
  const projectDependencies = path.join(project, 'node_modules')
  let dependencyLink
  try { dependencyLink = fs.readlinkSync(dependencies) } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (dependencyLink) {
    if (path.resolve(runtime, dependencyLink).toLowerCase() !== projectDependencies.toLowerCase()) {
      throw new Error(`Unexpected dependency link at ${dependencies}`)
    }
  } else {
    fs.symlinkSync(projectDependencies, dependencies, 'junction')
  }
  let existing
  try { existing = fs.lstatSync(output) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (existing) {
    let target
    try { target = fs.readlinkSync(output) } catch { /* Cloud placeholders are not real links. */ }
    if (target && path.resolve(project, target).toLowerCase() === legacyCache.toLowerCase()) {
      // Remove only the old junction; preserve its generated files.
      fs.unlinkSync(output)
      existing = undefined
    } else if (!target || path.resolve(project, target).toLowerCase() !== cache.toLowerCase()) {
      console.error('The existing .next folder is not the local cache link. Stop Next.js, remove only the generated .next folder, then run npm run build again.')
      process.exit(1)
    }
  }
  if (!existing) {
    fs.symlinkSync(cache, output, 'junction')
  }
}
