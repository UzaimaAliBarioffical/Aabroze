// =================================================================
// AABROZE — Central TypeScript Types
// =================================================================

export type Role = 'customer' | 'admin'

// ─── User / Auth ─────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: Role
  created_at: string
}

// ─── Category ────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

// ─── Product ─────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  description: string | null
  fabric: string | null
  color: string | null
  care_instructions: string | null
  price: number
  sale_price: number | null
  category_id: string | null
  category?: Category
  images?: ProductImage[]
  variants?: ProductVariant[]
  is_featured: boolean
  is_new_arrival: boolean
  is_published: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  cloudinary_public_id: string | null
  alt_text: string | null
  display_order: number
  is_video: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string
  stock: number
  sku_suffix: string | null
  /** Optional per-size price. When null, use product.sale_price ?? product.price */
  price?: number | null
}

// ─── Cart ─────────────────────────────────────────────────────────
export interface CartItem {
  product_id: string
  variant_id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  image_url: string
  size: string
  quantity: number
}

// ─── Order ───────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded'

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_whatsapp: string | null
  province: string
  city: string
  address: string
  postal_code: string | null
  order_notes: string | null
  subtotal: number
  delivery_charges: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: OrderStatus
  idempotency_key: string
  items?: OrderItem[]
  payment?: Payment
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  product_name: string
  size: string
  quantity: number
  unit_price: number
  total_price: number
  image_url: string | null
  product?: Product
}

// ─── Payment ─────────────────────────────────────────────────────
export interface Payment {
  id: string
  order_id: string
  gateway: PaymentMethod
  gateway_reference: string | null
  amount: number
  currency: string
  status: PaymentStatus
  raw_response: Record<string, unknown> | null
  verified_at: string | null
  created_at: string
}

// ─── Newsletter ───────────────────────────────────────────────────
export interface NewsletterSubscriber {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

// ─── Site Settings ────────────────────────────────────────────────
export interface SiteSetting {
  key: string
  value: string
  label: string | null
  updated_at: string
}

// ─── API Responses ───────────────────────────────────────────────
export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Filter / Sort ────────────────────────────────────────────────
export interface ProductFilters {
  category?: string
  sizes?: string[]
  colors?: string[]
  min_price?: number
  max_price?: number
  in_stock?: boolean
  is_new_arrival?: boolean
  is_featured?: boolean
  is_on_sale?: boolean
}

export type ProductSortKey = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

// ─── Checkout ─────────────────────────────────────────────────────
export interface CheckoutFormData {
  full_name: string
  phone: string
  whatsapp: string
  email: string
  province: string
  city: string
  address: string
  postal_code?: string
  order_notes?: string
  payment_method: PaymentMethod
}

// ─── Admin Dashboard ─────────────────────────────────────────────
export interface DashboardStats {
  total_orders: number
  total_revenue: number
  pending_orders: number
  low_stock_count: number
}

// ─── Toast ───────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// ─── Pakistan Geo ─────────────────────────────────────────────────
export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
] as const

export type Province = (typeof PAKISTAN_PROVINCES)[number]

export const DELIVERY_CHARGES: Record<string, number> = {
  Punjab: 200,
  Sindh: 250,
  'Khyber Pakhtunkhwa': 250,
  Balochistan: 300,
  'Islamabad Capital Territory': 200,
  'Gilgit-Baltistan': 350,
  'Azad Jammu & Kashmir': 300,
}

export const LOW_STOCK_THRESHOLD = 3
