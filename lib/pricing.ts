import type { Product, ProductVariant } from '@/types'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function toMoney(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

/** Authoritative unit price: variant.price ?? product.sale_price ?? product.price */
export function getVariantUnitPrice(
  product: Pick<Product, 'price' | 'sale_price'>,
  variant?: Pick<ProductVariant, 'price'> | null
): number {
  if (variant?.price != null && Number.isFinite(Number(variant.price))) {
    return toMoney(variant.price)
  }
  if (product.sale_price != null && Number.isFinite(Number(product.sale_price))) {
    return toMoney(product.sale_price)
  }
  return toMoney(product.price)
}

export function isRealPurchasableProduct(product: Product): boolean {
  if (!isUuid(product.id)) return false
  const variants = product.variants ?? []
  return variants.some((v) => isUuid(v.id) && isUuid(v.product_id || product.id))
}

/** Display the prices a shopper can actually select without changing catalog values. */
export function getProductPriceRange(product: Product) {
  const variants = product.variants ?? []
  const available = variants.filter(variant => variant.stock > 0)
  const displayed = available.length ? available : variants
  const prices = displayed.length
    ? displayed.map(variant => getVariantUnitPrice(product, variant))
    : [getVariantUnitPrice(product)]
  return { min: Math.min(...prices), max: Math.max(...prices),
    hasVariantPrices: displayed.some(variant => variant.price != null) }
}

const SIZE_RANK: Record<string, number> = {
  xs: 0,
  s: 1,
  small: 2,
  m: 3,
  medium: 4,
  l: 5,
  large: 6,
  xl: 7,
  xxl: 8,
  xxxl: 9,
}

export function sortVariants<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => {
    const ra = SIZE_RANK[a.size.toLowerCase()] ?? 50
    const rb = SIZE_RANK[b.size.toLowerCase()] ?? 50
    if (ra !== rb) return ra - rb
    return a.size.localeCompare(b.size)
  })
}
