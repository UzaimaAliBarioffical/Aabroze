import { z } from 'zod'
import type { Product } from '@/types'

// Postgres numeric columns may arrive as decimal strings. Missing values are
// invalid, never silently converted to a zero price or fabricated inventory.
const numeric = z.union([z.number(), z.string().trim().min(1)]).pipe(z.coerce.number().finite().nonnegative())
const variant = z.object({
  id: z.string().uuid(), product_id: z.string().uuid(), size: z.string().trim().min(1),
  stock: numeric.pipe(z.number().int()), price: numeric.nullish(),
}).passthrough()
const product = z.object({
  id: z.string().uuid(), name: z.string().min(1), slug: z.string().min(1),
  price: numeric, sale_price: numeric.nullable(),
  variants: z.array(z.unknown()).nullish(),
}).passthrough()

export function normalizeCatalogProduct(value: unknown): Product | null {
  const parsed = product.safeParse(value)
  if (!parsed.success) return null
  const variants = (parsed.data.variants ?? []).flatMap((entry) => {
    const result = variant.safeParse(entry)
    return result.success && result.data.product_id === parsed.data.id ? [result.data] : []
  })
  return { ...parsed.data, variants } as unknown as Product
}

const sizeAliases: Record<string, string> = { small: 'S', medium: 'M', large: 'L', 'extra large': 'XL', 'extra-large': 'XL' }
export function missingStandardSizes(variants: { size: string }[]) {
  const present = new Set(variants.map(({ size }) => sizeAliases[size.trim().toLowerCase()] ?? size.trim().toUpperCase()))
  return ['S', 'M', 'L', 'XL'].filter(size => !present.has(size))
}
