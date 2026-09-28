// Read-only diagnostics. Never print keys, customer records, or SMTP passwords.
require('@next/env').loadEnvConfig(process.cwd())
const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('node:fs')
const path = require('node:path')

async function main() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'EMAIL_USER', 'EMAIL_PASS']
  const missing = required.filter(name => !process.env[name]?.trim())
  for (const name of required) console.log(`${name}: ${missing.includes(name) ? 'MISSING' : 'configured'}`)
  const previews = [...readFileSync(path.join(__dirname, '../lib/collection-images.ts'), 'utf8').matchAll(/slug: '([^']+)'/g)].map(match => match[1])
  console.log('Local image preview slugs:', previews.join(', '))
  if (missing.some(name => name.startsWith('NEXT_PUBLIC_SUPABASE_'))) {
    console.log('Catalog not queried: configure the existing project URL and public anon key in .env.local. Preview images have no prices, IDs or inventory.')
    process.exitCode = 1
    return
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim()
  const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(), { auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
  const { data, error } = await client.from('products')
    .select('id,slug,name,price,sale_price,variants:product_variants(id,product_id,size,price,stock)')
    .eq('is_published', true).eq('is_archived', false)
  if (error) {
    console.error('Public catalog query failed:', error.code || 'connection error', '(check project keys, tables, relationships and read policies)')
    process.exitCode = 1
    return
  }
  console.log(`Publicly readable published products: ${data.length}`)
  for (const item of data) {
    console.log(JSON.stringify({ id: item.id, slug: item.slug, price: item.price, sale_price: item.sale_price, variants: item.variants }))
  }
  for (const slug of previews) console.log(`${slug}: ${data.some(item => item.slug === slug) ? 'exact catalog match' : 'NO exact published match; owner must confirm the correct product identity'}`)
  if (!data.length) {
    console.log('No catalog rows visible. Check products in Table Editor: publication/archive flags and public SELECT policies. Do not publish the [REPLACE] sample seed products.')
    process.exitCode = 1
  }
  if (!missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
    for (const table of ['orders', 'order_items', 'payments', 'order_email_jobs']) {
      const result = await admin.from(table).select('id').limit(0)
      console.log(`${table}: ${result.error ? 'unavailable; verify schema and server key' : 'accessible'}`)
      if (result.error) process.exitCode = 1
    }
    console.log('No order created. Verify place_store_order and claim_order_emails in Database > Functions against migration 003.')
  }
  if (missing.length) process.exitCode = 1
}
main().catch(() => { console.error('Catalog diagnostic failed. Check URL, credentials and connectivity; no secret values were logged.'); process.exitCode = 1 })
