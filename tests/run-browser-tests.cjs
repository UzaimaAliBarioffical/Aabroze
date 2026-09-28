// Build-time public configuration must match the isolated test server.
// These values are scoped to child processes and never written to .env.local.
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const env = {
  ...process.env,
  AABROZE_DIST_DIR: '.next-purchase-tests',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3111',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-test-anon',
  NEXT_PUBLIC_DELIVERY_CHARGE: '200',
  NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD: '0',
}
for (const args of [
  [path.join(__dirname, '../scripts/prepare-next-cache.cjs')],
  [require.resolve('next/dist/bin/next'), 'build'],
  [require.resolve('@playwright/test/cli'), 'test', ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: path.join(__dirname, '..'), env, stdio: 'inherit', windowsHide: true,
  })
  if (result.error) { console.error(result.error.message); process.exit(1) }
  if (result.status !== 0) process.exit(result.status || 1)
}
