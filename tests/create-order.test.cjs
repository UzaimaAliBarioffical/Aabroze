require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const admin = require('../lib/supabase/admin.ts')
const { placeStoreOrder } = require('../lib/create-order.ts')
const { customer, items } = require('./database.cjs')

test('checkout never reports success for an incomplete database receipt', async () => {
  const original = admin.createSupabaseAdminClient
  try {
    for (const data of [null, {}, { order: {} }, { order: { id: 'id', order_number: 'number', total: 100, items: [] } }]) {
      admin.createSupabaseAdminClient = () => ({ rpc: async () => ({ data, error: null }) })
      const result = await placeStoreOrder({ customer, items })
      assert.equal(result.success, false)
      assert.equal(result.retryable, true)
      assert.equal(result.order, undefined)
    }
  } finally { admin.createSupabaseAdminClient = original }
})
