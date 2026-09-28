'use client'
import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { useCart } from '@/context/CartContext'
import type { CheckoutSource } from '@/context/OrderRequestContext'
import { cartPriceLabel, readCart } from '@/lib/cart'
import { orderRequestSchema, requestCustomerSchema, type OrderRequestInput } from '@/lib/order-request-schema'
import { getProductImage } from '@/lib/collection-images'
import { getVariantUnitPrice, sortVariants } from '@/lib/pricing'
import { missingStandardSizes } from '@/lib/catalog-data'
import { PAKISTAN_PROVINCES, type CartItem } from '@/types'

const pendingKey = 'aabroze_email_pending'
type Pending = { input: OrderRequestInput; items: CartItem[]; fromCart: boolean }
export default function OrderCheckoutModal({ source, onClose }: { source: CheckoutSource; onClose: () => void }) {
  const { items: cartItems, addItem, removePurchased, closeCart, updateQuantity } = useCart()
  const [size, setSize] = useState(source.size || '')
  const [quantity, setQuantity] = useState(source.quantity || 1)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', whatsapp: '', address: '', city: '', province: 'Punjab', postal_code: '', order_notes: '' })
  const [pending, setPending] = useState<Pending | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<string | null>(null)
  const lock = useRef(false)
  const [key, setKey] = useState('')
  const cartMode = source.mode === 'cart'
  const direct = !!(source.product || source.preview)
  useEffect(() => {
    closeCart()
    setKey(crypto.randomUUID())
    if (!cartMode) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(pendingKey) || 'null')
        const input = orderRequestSchema.safeParse(saved?.input)
        const items = readCart(JSON.stringify(saved?.items || []))
        if (input.success && items.length && typeof saved.fromCart === 'boolean') {
          setPending({ input: input.data, items, fromCart: saved.fromCart })
          setForm({ ...input.data.customer, whatsapp: input.data.customer.whatsapp || '', postal_code: input.data.customer.postal_code || '', order_notes: input.data.customer.order_notes || '' })
        }
      } catch { /* Invalid local data is ignored. */ }
    }
    setReady(true)
  }, [cartMode, closeCart])

  const variant = source.product?.variants?.find(v => v.size === size)
  const max = source.product ? Math.min(variant?.stock ?? 0, 10) : 10
  const item: CartItem | null = source.product && variant ? {
    product_id: source.product.id, variant_id: variant.id, name: source.product.name, slug: source.product.slug,
    size: variant.size, price: getVariantUnitPrice(source.product, variant), sale_price: null,
    quantity, stock: variant.stock, image_url: getProductImage(source.product),
  } : source.preview && size ? {
    product_id: `preview:${source.preview.slug}`, variant_id: `request:${size}`, request_only: true,
    name: source.preview.name, slug: source.preview.slug, size, quantity, price: null, sale_price: null, image_url: source.preview.src,
  } : null
  const items = pending?.items ?? (direct ? item ? [item] : [] : cartItems)
  const setField = (name: keyof typeof form, value: string) => setForm(current => ({ ...current, [name]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (lock.current || !ready) return
    setError('')
    if (!items.length || (direct && !pending && (!size || quantity > max || max < 1))) { setError('Please select an available size and quantity.'); return }
    if (cartMode) { if (item && addItem(item)) onClose(); return }
    const candidate = pending?.input ?? { idempotency_key: key, customer: form, items: items.map(entry => ({
      slug: entry.slug, size: entry.size, quantity: entry.quantity,
      ...(!entry.request_only ? { product_id: entry.product_id, variant_id: entry.variant_id } : {}),
    })) }
    const parsed = orderRequestSchema.safeParse(candidate)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Please check your details.'); return }
    const attempt = pending ?? { input: parsed.data, items, fromCart: !direct }
    try { sessionStorage.setItem(pendingKey, JSON.stringify(attempt)) }
    catch { setError('Please enable browser storage so your request can be retried safely.'); return }
    setPending(attempt)
    lock.current = true
    setBusy(true)
    try {
      const response = await fetch('/api/order-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt.input) })
      const result = await response.json()
      if (!response.ok || !result.success || result.receipt?.accepted !== true || typeof result.receipt?.id !== 'string') {
        setError(result.error || 'The email has not been confirmed. Retry this same request.')
        if (response.status === 400) {
          setPending(null)
          sessionStorage.removeItem(pendingKey)
          setKey(crypto.randomUUID())
        }
        return
      }
      setReceipt(result.receipt.id)
      if (attempt.fromCart) removePurchased(attempt.items)
      try { sessionStorage.removeItem(pendingKey) } catch { /* Receipt remains visible. */ }
    } catch { setError('We could not confirm the response. Retry this same request to avoid sending it twice.') }
    finally { lock.current = false; setBusy(false) }
  }

  const variants = source.product ? sortVariants(source.product.variants ?? []) : []
  return <Modal isOpen onClose={() => { if (!busy) onClose() }} title={cartMode ? 'Select Size' : 'Checkout'} size="lg">
    {receipt ? <div role="status" className="space-y-4 text-center">
      <h3 className="font-serif text-2xl">Your order request has been sent.</h3>
      <p className="text-sm">Request ID: {receipt}</p>
      <p className="text-sm">Our email provider accepted your request. AABROZE will contact you to confirm price, availability and delivery. This is not yet a confirmed sale.</p>
      <Button onClick={onClose}>Continue Shopping</Button>
    </div> : <form onSubmit={submit} noValidate className="space-y-5">
      {!cartMode && <p className="text-xs text-charcoal-200">Send your order request directly to AABROZE. No payment is collected now; final price and availability will be confirmed.</p>}
      {pending && <p role="status" className="text-xs">Your previous request is saved. Retry it with these same details. Request ID: ABZ-REQ-{pending.input.idempotency_key.toUpperCase()}</p>}
      <fieldset disabled={busy || !!pending || !ready} className="space-y-4">
        {direct && !pending && <div className="space-y-3 border-b border-beige-200 pb-4">
          <h3 className="font-serif text-xl">{source.product?.name || source.preview?.name}</h3>
          <label className="form-label">Size</label>
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Available sizes">
            {(source.product ? [...variants.map(v => ({ size: v.size, available: v.stock > 0 })), ...missingStandardSizes(variants).map(size => ({ size, available: false }))]
              : ['S', 'M', 'L', 'XL'].map(size => ({ size, available: true }))).map(v =>
              <button type="button" key={v.size} role="option" aria-selected={size === v.size} disabled={!v.available}
                className={`size-btn ${size === v.size ? 'selected' : ''}`} onClick={() => { setSize(v.size); setQuantity(1) }}>{v.size}</button>)}
          </div>
          <Input label="Quantity" type="number" min={1} max={max || 10} value={quantity}
            onChange={event => setQuantity(Math.max(1, Math.min(max || 10, Math.floor(Number(event.target.value) || 1))))} />
          <p className="text-sm">{item ? cartPriceLabel(item) : source.preview ? 'Price to be confirmed' : 'Select a size to see its price'}</p>
          {source.preview && <p className="text-xs">Size availability will be confirmed by the store.</p>}
        </div>}
        {(!direct || pending) && <ul className="space-y-3">{items.map(entry => <li key={`${entry.product_id}-${entry.variant_id}`} className="border-b border-beige-200 pb-3 text-sm">
          <p className="font-serif">{entry.name}</p><p>Size: {entry.size} · {cartPriceLabel(entry)}</p>
          <Input label={`Quantity for ${entry.name}, size ${entry.size}`} type="number" min={1} max={Math.min(entry.stock ?? 10, 10)} value={entry.quantity}
            onChange={event => updateQuantity(entry.product_id, entry.variant_id, Math.max(1, Number(event.target.value) || 1))} />
        </li>)}</ul>}
        {!cartMode && <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name *" autoComplete="name" value={form.full_name} onChange={e => setField('full_name', e.target.value)} required />
            <Input label="Email Address *" type="email" autoComplete="email" value={form.email} onChange={e => setField('email', e.target.value)} required />
            <Input label="Phone / WhatsApp Number *" type="tel" autoComplete="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} required />
            <Input label="Alternate Phone Number" type="tel" value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value)} />
          </div>
          <Textarea label="Complete Delivery Address *" autoComplete="street-address" value={form.address} onChange={e => setField('address', e.target.value)} required />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="City *" autoComplete="address-level2" value={form.city} onChange={e => setField('city', e.target.value)} required />
            <Select label="Province *" value={form.province} onChange={e => setField('province', e.target.value)} options={PAKISTAN_PROVINCES.map(value => ({ value, label: value }))} />
            <Input label="Postal Code (optional)" autoComplete="postal-code" value={form.postal_code} onChange={e => setField('postal_code', e.target.value)} />
          </div>
          <Textarea label="Order Notes (optional)" value={form.order_notes} onChange={e => setField('order_notes', e.target.value)} />
        </>}
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button type="submit" className="w-full" loading={busy} disabled={busy || !ready}>{cartMode ? 'Add to Cart' : pending ? 'Retry / Confirm Request' : 'Place Order'}</Button>
    </form>}
  </Modal>
}
