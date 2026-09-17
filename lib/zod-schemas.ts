import { z } from 'zod'

// ─── Checkout ─────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => /^(0[0-9]{10}|\+92[0-9]{10})$/.test(v), {
      message: 'Enter a valid Pakistani phone number (e.g. 03XXXXXXXXX or +923XXXXXXXXX)',
    }),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => v === '' || /^(0[0-9]{10}|\+92[0-9]{10})$/.test(v), {
      message: 'Enter a valid WhatsApp number (e.g. 03XXXXXXXXX or +923XXXXXXXXX)',
    })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address'),
  province: z.enum(
    [
      'Punjab',
      'Sindh',
      'Khyber Pakhtunkhwa',
      'Balochistan',
      'Islamabad Capital Territory',
      'Gilgit-Baltistan',
      'Azad Jammu & Kashmir',
    ],
    { errorMap: () => ({ message: 'Select a valid province' }) }
  ),
  city: z.string().min(2, 'Enter your city').max(100).trim(),
  address: z
    .string()
    .min(10, 'Enter a complete address')
    .max(500)
    .trim(),
  postal_code: z
    .string()
    .regex(/^[0-9]{5}$/, 'Enter a valid 5-digit postal code')
    .optional()
    .or(z.literal('')),
  order_notes: z.string().max(500).optional().or(z.literal('')),
  payment_method: z.enum(['cod', 'jazzcash', 'easypaisa'], {
    errorMap: () => ({ message: 'Select a payment method' }),
  }),
  idempotency_key: z
    .string()
    .uuid('Invalid idempotency key'),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

// ─── Cart Item ────────────────────────────────────────────────────
export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
})

export type CartItemInput = z.infer<typeof cartItemSchema>

// ─── Checkout Cart ────────────────────────────────────────────────
export const checkoutCartSchema = z.array(cartItemSchema).min(1, 'Cart is empty').max(50)

// ─── Newsletter ───────────────────────────────────────────────────
export const newsletterSchema = z.object({
  email: z.string().email('Enter a valid email address').trim().toLowerCase(),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

// ─── Contact Form ─────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().trim(),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(3).max(200).trim(),
  message: z.string().min(10).max(2000).trim(),
})

export type ContactInput = z.infer<typeof contactSchema>

// ─── Product (Admin) ─────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .min(2)
    .max(200),
  sku: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(5000).optional().or(z.literal('')),
  fabric: z.string().max(200).optional().or(z.literal('')),
  color: z.string().max(100).optional().or(z.literal('')),
  care_instructions: z.string().max(1000).optional().or(z.literal('')),
  price: z.number().min(0.01, 'Price must be greater than 0').max(999999),
  sale_price: z.number().min(0).max(999999).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_published: z.boolean().default(false),
})

export type ProductInput = z.infer<typeof productSchema>

export const productVariantSchema = z.object({
  size: z.string().min(1).max(50),
  stock: z.number().int().min(0).max(9999),
  sku_suffix: z.string().max(50).optional().or(z.literal('')),
  price: z.number().min(0).max(999999).optional().nullable(),
})

export type ProductVariantInput = z.infer<typeof productVariantSchema>

// ─── Order Status Update (Admin) ─────────────────────────────────
export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']),
})

export const paymentStatusSchema = z.object({
  payment_status: z.enum(['unpaid', 'paid', 'failed', 'refunded']),
})

// ─── Site Setting ─────────────────────────────────────────────────
export const siteSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
})
