import { z } from 'zod'
import { checkoutSchema } from '@/lib/zod-schemas'

export const requestCustomerSchema = checkoutSchema.omit({ payment_method: true, idempotency_key: true })
export const orderRequestSchema = z.object({
  idempotency_key: z.string().uuid(),
  customer: requestCustomerSchema,
  items: z.array(z.object({
    slug: z.string().min(1).max(200), product_id: z.string().uuid().optional(),
    variant_id: z.string().uuid().optional(), size: z.string().trim().min(1).max(50),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(50),
})
export type OrderRequestInput = z.infer<typeof orderRequestSchema>
