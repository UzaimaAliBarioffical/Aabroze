require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getProductPriceRange } = require('../lib/pricing.ts')

test('card prices use selectable size prices and preserve zero-valued sales', () => {
  const product = { price: 2500, sale_price: 2200, variants: [
    { stock: 5, price: 2700 }, { stock: 2, price: null }, { stock: 0, price: 1000 },
  ] }
  assert.deepEqual(getProductPriceRange(product), { min: 2200, max: 2700, hasVariantPrices: true })
  assert.equal(getProductPriceRange({ ...product, variants: [{ stock: 1, price: 2700 }] }).min, 2700)
  assert.equal(getProductPriceRange({ ...product, sale_price: 0, variants: [] }).min, 0)
  assert.equal(product.price, 2500)
  assert.equal(product.variants[0].price, 2700)
})
