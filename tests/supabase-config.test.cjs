require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getSupabasePublicConfig, validateSupabaseUrl, SupabaseConfigurationError } = require('../lib/supabase/config.ts')

test('missing public configuration names the required settings without creating a client', () => {
  const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const original = names.map((name) => process.env[name])
  try {
    for (const name of names) delete process.env[name]
    assert.throws(getSupabasePublicConfig, (error) => {
      assert.ok(error instanceof SupabaseConfigurationError)
      for (const name of names) assert.ok(error.message.includes(name))
      assert.ok(!error.message.includes('SUPABASE_SERVICE_ROLE_KEY'))
      return true
    })
    const { createSupabaseClient } = require('../lib/supabase/client.ts')
    assert.throws(createSupabaseClient, SupabaseConfigurationError)
  } finally {
    names.forEach((name, index) => {
      if (original[index] === undefined) delete process.env[name]
      else process.env[name] = original[index]
    })
  }
})

test('URL validation rejects invalid schemes without echoing configuration values', () => {
  for (const value of ['not-a-project-url', 'file:///private/config', 'https://user:password@example.com']) {
    assert.throws(() => validateSupabaseUrl(value), (error) => {
      assert.ok(error instanceof SupabaseConfigurationError)
      assert.equal(error.message, 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) project URL.')
      return true
    })
  }
  assert.equal(validateSupabaseUrl('http://localhost:54321'), 'http://localhost:54321')
})

test('catalog tolerates missing configuration but preserves Next.js dynamic rendering signals', async () => {
  const server = require('../lib/supabase/server.ts')
  const original = server.createSupabaseServerClient
  const { fetchPublishedProducts, fetchPublishedProductBySlug, fetchActiveCategories } = require('../lib/products.ts')
  try {
    server.createSupabaseServerClient = async () => { throw new SupabaseConfigurationError('Configuration missing') }
    assert.deepEqual(await fetchPublishedProducts(), [])
    assert.equal(await fetchPublishedProductBySlug('unavailable'), null)
    assert.deepEqual(await fetchActiveCategories(), [])

    const dynamic = Object.assign(new Error('Dynamic rendering required'), { digest: 'DYNAMIC_SERVER_USAGE' })
    server.createSupabaseServerClient = async () => { throw dynamic }
    await assert.rejects(fetchPublishedProducts, (error) => error === dynamic)
    await assert.rejects(() => fetchPublishedProductBySlug('unavailable'), (error) => error === dynamic)
    await assert.rejects(fetchActiveCategories, (error) => error === dynamic)
  } finally {
    server.createSupabaseServerClient = original
  }
})
