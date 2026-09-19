'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SafeImage from '@/components/ui/SafeImage'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { useCart } from '@/context/CartContext'
import { checkoutSchema, type CheckoutInput } from '@/lib/zod-schemas'
import { BUY_NOW_KEY, readCart } from '@/lib/cart'
import { formatPKR, getDeliveryCharges, isFreeShipping } from '@/lib/utils'
import { getCollectionImage } from '@/lib/collection-images'
import { PAKISTAN_PROVINCES } from '@/types'
import { STORE_PHONE_LOCAL, STORE_PHONE_TEL, storeWhatsAppUrl } from '@/lib/store-contact'
import type { CartItem, PaymentMethod } from '@/types'

type FieldErrors = Record<string, string>

export default function CheckoutPage() {
  return <Suspense fallback={<p className="container-narrow py-20">Loading checkout…</p>}><CheckoutContent /></Suspense>
}

type PendingCheckout = { customer: CheckoutInput; items: CartItem[] }

function CheckoutContent() {
  const router = useRouter()
  const search = useSearchParams()
  const buyNow = search.get('mode') === 'buy-now'
  const receiptKey = search.get('order')
  const pendingKey = buyNow ? 'aabroze_pending_direct' : 'aabroze_pending_cart'
  const { items: cartItems, removePurchased, closeCart, ready } = useCart()
  const [directItems, setDirectItems] = useState<CartItem[]>([])
  const [pending, setPending] = useState<PendingCheckout | null>(null)
  const [initialized, setInitialized] = useState(false)
  const submitLock = useRef(false)
  const items = pending?.items ?? (buyNow ? directItems : cartItems)
  const subtotal = items.reduce((sum, item) => sum + (item.sale_price ?? item.price) * item.quantity, 0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [successNumber, setSuccessNumber] = useState<string | null>(null)
  const [successTotal, setSuccessTotal] = useState<number | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    province: 'Punjab',
    city: '',
    address: '',
    postal_code: '',
    order_notes: '',
    payment_method: 'cod' as PaymentMethod,
  })

  useEffect(() => {
    closeCart()
    setIdempotencyKey(crypto.randomUUID())
    setPending(null)
    setSuccessNumber(null)
    try {
      if (buyNow) setDirectItems(readCart(sessionStorage.getItem(BUY_NOW_KEY)))
      const saved = JSON.parse(sessionStorage.getItem(pendingKey) || 'null')
      const customer = checkoutSchema.safeParse(saved?.customer)
      const savedItems = readCart(JSON.stringify(saved?.items ?? []))
      if (customer.success && savedItems.length) {
        setPending({ customer: customer.data, items: savedItems })
        setForm({ ...customer.data, whatsapp: customer.data.whatsapp ?? '', postal_code: customer.data.postal_code ?? '', order_notes: customer.data.order_notes ?? '' })
        setIdempotencyKey(customer.data.idempotency_key)
      }
      if (receiptKey) {
        const receipt = JSON.parse(sessionStorage.getItem(`aabroze_receipt_${receiptKey}`) || 'null')
        if (typeof receipt?.number === 'string' && typeof receipt?.total === 'number') {
          setSuccessNumber(receipt.number)
          setSuccessTotal(receipt.total)
        }
      }
    } catch { /* Unavailable or invalid browser storage. */ }
    setInitialized(true)
  }, [closeCart, buyNow, pendingKey, receiptKey])

  const delivery = isFreeShipping(subtotal) ? 0 : getDeliveryCharges(form.province)
  const total = subtotal + delivery

  const provinceOptions = useMemo(
    () => PAKISTAN_PROVINCES.map((p) => ({ value: p, label: p })),
    []
  )

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitLock.current || !initialized || !ready) return
    setFormError('')

    if (items.length === 0) {
      setFormError('Your cart is empty')
      return
    }

    const parsed = checkoutSchema.safeParse(pending?.customer ?? {
      ...form,
      idempotency_key: idempotencyKey,
    })

    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      setFormError('Please correct the highlighted fields')
      return
    }

    const attempt: PendingCheckout = pending ?? { customer: parsed.data, items: [...items] }
    try { sessionStorage.setItem(pendingKey, JSON.stringify(attempt)) }
    catch { setFormError('Please enable browser storage so your order can be retried safely.'); return }
    setPending(attempt)
    submitLock.current = true
    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: attempt.customer,
          items: attempt.items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        setFormError(result.error || 'Could not place order')
        if (response.status === 400) {
          setPending(null)
          setIdempotencyKey(crypto.randomUUID())
          try { sessionStorage.removeItem(pendingKey) } catch { /* Keep UI usable. */ }
        }
        return
      }
      setSuccessNumber(result.data.order_number)
      setSuccessTotal(result.data.total)
      if (!buyNow) removePurchased(attempt.items)
      setPending(null)
      try {
        sessionStorage.setItem(`aabroze_receipt_${attempt.customer.idempotency_key}`, JSON.stringify({ number: result.data.order_number, total: result.data.total }))
        sessionStorage.removeItem(pendingKey)
        if (buyNow) sessionStorage.removeItem(BUY_NOW_KEY)
        router.replace(`/checkout?order=${attempt.customer.idempotency_key}`)
      } catch { /* The order is saved even if receipt storage is unavailable. */ }
    } catch {
      setFormError('We could not confirm the response. Retry this checkout to safely recover your order without placing it twice.')
    } finally {
      setSubmitting(false)
      submitLock.current = false
    }
  }

  if (successNumber) {
    return (
      <div className="container-narrow py-16 md:py-24 text-center space-y-4">
        <p className="section-subheading">Thank you for shopping with AABROZE!</p>
        <h1 className="section-heading">Your order has been placed successfully.</h1>
        <p className="text-sm font-sans text-charcoal-200">
          Your order <strong className="text-charcoal-300">{successNumber}</strong> has been received.
          We will contact you shortly to confirm delivery.
        </p>
        <p className="text-sm font-sans">Payment Method: Cash on Delivery</p>
        {successTotal !== null && <p className="text-sm font-sans">Grand total: {formatPKR(successTotal)}</p>}
        <p className="text-xs font-sans text-taupe-200">
          Questions? Call{' '}
          <a href={STORE_PHONE_TEL} className="underline">
            {STORE_PHONE_LOCAL}
          </a>{' '}
          or{' '}
          <a href={storeWhatsAppUrl(`Hello AABROZE, I have a question about order ${successNumber}`)} className="underline">
            WhatsApp us
          </a>
          .
        </p>
        <div className="pt-4">
          <Link href="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!ready || !initialized) return <p className="container-narrow py-20">Loading checkout…</p>

  if (items.length === 0) {
    return (
      <div className="container-narrow py-20 text-center space-y-4">
        <h1 className="text-3xl font-serif text-charcoal-300">Your bag is empty</h1>
        <p className="text-xs text-charcoal-200 font-sans">Add a piece before checking out.</p>
        <Button onClick={() => router.push('/shop')}>Shop the Collection</Button>
      </div>
    )
  }

  return (
    <div className="container-wide py-10 md:py-16">
      <div className="text-center mb-10 space-y-2">
        <p className="section-subheading">Secure Checkout</p>
        <h1 className="section-heading">Customer Details</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start" noValidate>
        <div className="lg:col-span-3 space-y-5 bg-white border border-beige-200 p-5 sm:p-8">
          <p className="text-xs font-sans">Delivery country: Pakistan</p>
          {pending && <p className="text-xs font-sans" role="status">Your checkout details are saved. Retry to confirm this same order.</p>}
          <fieldset disabled={submitting || pending !== null} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              name="full_name"
              autoComplete="name"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
              error={errors.full_name}
              required
            />
            <Input
              label="Email *"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Phone Number *"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="03XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={errors.phone}
              hint="03XXXXXXXXX or +923XXXXXXXXX"
              required
            />
            <Input
              label="Alternate Phone Number"
              name="whatsapp"
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', e.target.value)}
              error={errors.whatsapp}
              hint="Optional"
            />
          </div>

          <Input
            label="Full Address *"
            name="address"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City *"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              error={errors.city}
              required
            />
            <Select
              label="Province *"
              name="province"
              value={form.province}
              onChange={(e) => setField('province', e.target.value)}
              options={provinceOptions}
              error={errors.province}
              required
            />
            <Input
              label="Postal Code"
              name="postal_code"
              autoComplete="postal-code"
              value={form.postal_code}
              onChange={(e) => setField('postal_code', e.target.value)}
              error={errors.postal_code}
              hint="Optional"
            />
          </div>

          <Textarea
            label="Order Notes"
            name="order_notes"
            rows={3}
            value={form.order_notes}
            onChange={(e) => setField('order_notes', e.target.value)}
            error={errors.order_notes}
          />

          <fieldset className="space-y-2">
            <legend className="form-label">Payment Method *</legend>
            {[
              { id: 'cod', label: 'Cash on Delivery' },
            ].map((method) => (
              <label key={method.id} className="flex items-center gap-3 text-sm font-sans text-charcoal-300 border border-beige-200 px-4 py-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={method.id}
                  checked={form.payment_method === method.id}
                  onChange={() => setField('payment_method', method.id)}
                  className="accent-charcoal-300"
                />
                {method.label}
              </label>
            ))}
            {errors.payment_method && <p className="form-error">{errors.payment_method}</p>}
          </fieldset>
          </fieldset>

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <Button type="submit" className="w-full" size="lg" loading={submitting} disabled={submitting}>
            {pending ? 'Retry / Confirm Order' : 'Place Order'}
          </Button>

          <p className="text-[11px] text-taupe-200 font-sans text-center">
            Need help? Call{' '}
            <a href={STORE_PHONE_TEL} className="underline hover:text-charcoal-300">
              {STORE_PHONE_LOCAL}
            </a>{' '}
            or{' '}
            <a
              href={storeWhatsAppUrl('Hello AABROZE, I need help with checkout.')}
              className="underline hover:text-charcoal-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>

        <aside className="lg:col-span-2 bg-cream border border-beige-200 p-5 sm:p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl text-charcoal-300">Order Summary</h2>
          <ul className="divide-y divide-beige-200">
            {items.map((item) => (
              <li key={`${item.product_id}-${item.variant_id}`} className="flex gap-3 py-3">
                <div className="relative w-16 h-20 bg-beige-100 flex-shrink-0">
                  <SafeImage
                    src={item.image_url || getCollectionImage(item.slug).src}
                    fallbackSrc={getCollectionImage(item.slug).src}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm text-charcoal-300 line-clamp-2">{item.name}</p>
                  <p className="text-[11px] text-taupe-200 font-sans mt-0.5">Size: {item.size}</p>
                  <p className="text-[11px] text-taupe-200 font-sans">Qty: {item.quantity}</p>
                  <p className="text-xs font-sans text-charcoal-300 mt-1">
                    {formatPKR(item.sale_price ?? item.price)} each
                  </p>
                  <p className="text-xs font-sans">Line total: {formatPKR((item.sale_price ?? item.price) * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-xs font-sans text-charcoal-200 border-t border-beige-200 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery charges</span>
              <span>{delivery === 0 ? 'FREE' : formatPKR(delivery)}</span>
            </div>
            <div className="flex justify-between font-serif text-base text-charcoal-300 pt-2">
              <span>Total</span>
              <span>{formatPKR(total)}</span>
            </div>
            <p className="text-[11px] text-taupe-200">
              Payment is due when your order is delivered.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
