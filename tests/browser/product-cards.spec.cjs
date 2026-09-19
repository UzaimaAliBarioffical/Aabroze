const { test, expect } = require('@playwright/test')
const { productId, smallId, mediumId } = require('../database.cjs')

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:3111/__reset')
})

for (const width of [390, 1280]) {
  test(`all four image-only New Arrivals show both buttons without hover at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 })
    await request.post('http://127.0.0.1:3111/__catalog', { data: { empty: true } })
    await page.goto('/')
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'New Arrivals', exact: true }) })
    const slugs = ['lime-lilac-set', 'teal-embroidered-kurta', 'ochre-embroidered-kurta', 'crimson-kurta-set']
    for (const slug of slugs) {
      const card = section.locator(`[data-product-slug="${slug}"]`)
      await expect(card.locator('[data-product-price]')).toHaveText('Price unavailable')
      for (const name of ['Add to Cart', 'Buy Now']) {
        const button = card.getByRole('button', { name, exact: true })
        await button.scrollIntoViewIfNeeded()
        await page.mouse.move(0, 0)
        await expect(button).toBeVisible()
        await expect(button).toHaveCSS('opacity', '1')
        await button.click()
        await expect(card.getByRole('status')).toContainText('Price and sizes are currently unavailable')
        await expect(button).toBeEnabled()
      }
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('aabroze_cart') || '[]'))).toEqual([])
    expect(await page.evaluate(() => sessionStorage.getItem('aabroze_buy_now'))).toBeNull()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await section.screenshot({ path: `test-results/new-arrivals-${width}.png` })
    await page.goto('/shop')
    await expect(page.locator('article[data-product-slug]')).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toHaveCount(6)
  })
}

for (const route of ['/', '/shop', '/new-arrivals', '/collections/casual-wear']) {
  test(`catalog card on ${route}: visible price, size selection, Add to Cart and Buy Now`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(route)
    const card = page.locator('[data-product-slug="test-lawn-suit"]').first()
    await expect(card.locator('[data-product-price]')).toHaveText('From Rs 2,200')
    for (const name of ['Add to Cart', 'Buy Now']) {
      const button = card.getByRole('button', { name, exact: true })
      await button.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      await expect(button).toBeVisible()
      await expect(button).toHaveCSS('opacity', '1')
    }
    await card.getByRole('button', { name: 'Add to Cart', exact: true }).click()
    const cartModal = page.getByRole('dialog', { name: 'Select Size', exact: true })
    await expect(cartModal.getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled()
    await cartModal.getByRole('option', { name: /^S / }).click()
    await cartModal.getByRole('button', { name: 'Add to Cart', exact: true }).click()
    await page.getByRole('button', { name: 'Close cart' }).click()
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('aabroze_cart')))
    expect(cart).toHaveLength(1)
    expect(cart[0]).toMatchObject({ product_id: productId, variant_id: smallId, size: 'S', price: 2700, sale_price: null })
    await card.getByRole('button', { name: 'Buy Now', exact: true }).click()
    const buyModal = page.getByRole('dialog', { name: 'Buy Now', exact: true })
    await buyModal.getByRole('option', { name: /^M / }).click()
    await buyModal.getByRole('button', { name: 'Continue to Checkout', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout\?mode=buy-now/)
    await expect(page.locator('main').getByText('Size: M', { exact: true })).toBeVisible()
    const direct = await page.evaluate(() => JSON.parse(sessionStorage.getItem('aabroze_buy_now')))
    expect(direct[0]).toMatchObject({ product_id: productId, variant_id: mediumId, size: 'M', sale_price: 2200 })
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('aabroze_cart')))).toEqual(cart)
  })
}
