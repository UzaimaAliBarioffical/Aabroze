require('./load-ts.cjs')
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizeCatalogProduct, missingStandardSizes } = require('../lib/catalog-data.ts')
const { productId, smallId, mediumId } = require('./database.cjs')
const { getCollectionImage, getProductImage } = require('../lib/collection-images.ts')

test('catalog preserves real IDs and converts prices; missing money/stock never becomes zero', () => {
  const raw = { id: productId, name: 'Database product', slug: 'database-product', price: '2500.00', sale_price: '2200',
    variants: [{ id: smallId, product_id: productId, size: 'S', price: '2700', stock: 3 }] }
  const result = normalizeCatalogProduct(raw)
  assert.equal(result.price, 2500)
  assert.equal(result.sale_price, 2200)
  assert.deepEqual(result.variants[0], { ...raw.variants[0], price: 2700 })
  for (const price of [null, undefined, '', ' ', 'invalid', -1]) assert.equal(normalizeCatalogProduct({ ...raw, price }), null)
  assert.equal(normalizeCatalogProduct({ ...raw, sale_price: '0' }).sale_price, 0)
  for (const change of [{ stock: null }, { stock: -1 }, { stock: 'invalid' }, { product_id: mediumId }]) {
    assert.deepEqual(normalizeCatalogProduct({ ...raw, variants: [{ ...raw.variants[0], ...change }] }).variants, [])
  }
  assert.deepEqual(missingStandardSizes([{ size: 'Small' }, { size: ' M ' }, { size: 'large' }]), ['XL'])
})

test('catalog images never borrow an unrelated garment or use a video as the primary image', () => {
  assert.equal(getCollectionImage('unknown-existing-product').src, '/brand/aabroze-logo.jpeg')
  assert.equal(getCollectionImage('teal-embroidered-kurta').src, '/products/teal-embroidered-kurta.png')
  const images = [
    { url: '/video.mp4', is_video: true, display_order: 0 },
    { url: '/second.png', is_video: false, display_order: 2 },
    { url: '/first.png', is_video: false, display_order: 1 },
  ]
  assert.equal(getProductImage({ slug: 'unknown', images }), '/first.png')
  assert.equal(images[0].url, '/video.mp4')
})
