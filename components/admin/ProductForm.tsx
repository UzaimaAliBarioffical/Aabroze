'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import { createProduct, updateProduct, deleteProductImage, archiveProduct } from '@/actions/admin/products'
import type { Category, Product, ProductImage, ProductVariant } from '@/types'

interface ProductFormProps {
  product?: Product & { images?: ProductImage[]; variants?: ProductVariant[] }
  categories: Category[]
}

type VariantRow = { size: string; stock: number; sku_suffix: string }
type FlagKey = 'is_published' | 'is_featured' | 'is_new_arrival'

export default function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [msgType, setMsgType] = useState<'success' | 'error' | null>(null)
  const [msgText, setMsgText] = useState('')
  const [nameVal, setNameVal] = useState(product?.name ?? '')
  const [slugVal, setSlugVal] = useState(product?.slug ?? '')
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    is_published: product?.is_published ?? false,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
  })
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.map((v) => ({ size: v.size, stock: v.stock, sku_suffix: v.sku_suffix ?? '' })) ?? [
      { size: '', stock: 0, sku_suffix: '' },
    ]
  )
  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? [])
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function autoSlug(name: string) {
    if (!isEdit && name) setSlugVal(slugify(name))
  }

  function addVariant() {
    setVariants((prev) => [...prev, { size: '', stock: 0, sku_suffix: '' }])
  }

  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateVariant(idx: number, field: keyof VariantRow, value: string | number) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
  }

  async function handleDeleteImage(img: ProductImage) {
    setDeletingImageId(img.id)
    const result = await deleteProductImage(img.id, img.cloudinary_public_id)
    if (result.success) setExistingImages((prev) => prev.filter((i) => i.id !== img.id))
    setDeletingImageId(null)
  }

  async function handleArchive() {
    if (!product) return
    if (!confirm('Archive this product? It will be hidden from the store.')) return
    setArchiving(true)
    const result = await archiveProduct(product.id)
    if (result.error) {
      setMsgType('error')
      setMsgText(result.error)
      setArchiving(false)
    } else {
      router.push('/admin/products')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMsgType(null)
    setMsgText('')
    const formData = new FormData(event.currentTarget)
    variants.forEach((v) => {
      formData.append('variant_size', v.size)
      formData.append('variant_stock', String(v.stock))
      formData.append('variant_sku_suffix', v.sku_suffix)
    })
    try {
      if (isEdit) {
        const result = await updateProduct(product.id, formData)
        if (result?.error) {
          setMsgType('error')
          setMsgText(result.error)
        } else {
          setMsgType('success')
          setMsgText('Product saved successfully.')
        }
      } else {
        await createProduct(formData)
      }
    } catch {
      setMsgType('error')
      setMsgText('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const flagItems: { name: FlagKey; label: string }[] = [
    { name: 'is_published', label: 'Published (visible in store)' },
    { name: 'is_featured', label: 'Featured' },
    { name: 'is_new_arrival', label: 'New Arrival' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Hidden flag inputs — always submit the current flag state */}
      {flagItems.map(({ name }) => (
        <input key={name} type="hidden" name={name} value={flags[name] ? 'true' : 'false'} />
      ))}

      {/* Basic Info */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-4">
        <h2 className="font-serif text-xl text-charcoal-300">Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            name="name"
            required
            value={nameVal}
            onChange={(e) => { setNameVal(e.target.value); autoSlug(e.target.value) }}
          />
          <Input
            label="Slug *"
            name="slug"
            required
            value={slugVal}
            onChange={(e) => setSlugVal(e.target.value)}
            hint="URL: /shop/{slug}"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="SKU" name="sku" defaultValue={product?.sku ?? ''} />
          <div className="w-full">
            <label className="form-label">Category</label>
            <select name="category_id" defaultValue={product?.category_id ?? ''} className="form-input mt-2">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Textarea label="Description" name="description" rows={4} defaultValue={product?.description ?? ''} />
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Fabric" name="fabric" defaultValue={product?.fabric ?? ''} />
          <Input label="Color" name="color" defaultValue={product?.color ?? ''} />
          <Input label="Care Instructions" name="care_instructions" defaultValue={product?.care_instructions ?? ''} />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-4">
        <h2 className="font-serif text-xl text-charcoal-300">Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Price (PKR) *" name="price" type="number" min="1" step="1" required defaultValue={product?.price ?? ''} />
          <Input label="Sale Price (PKR)" name="sale_price" type="number" min="0" step="1" defaultValue={product?.sale_price ?? ''} hint="Leave empty for no sale" />
        </div>
      </section>

      {/* Variants */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-4">
        <h2 className="font-serif text-xl text-charcoal-300">Sizes &amp; Stock</h2>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="Size (e.g. S, M, L, XL)"
                className="form-input flex-1"
                value={v.size}
                onChange={(e) => updateVariant(i, 'size', e.target.value)}
              />
              <input
                type="number"
                placeholder="Stock"
                min="0"
                className="form-input w-24"
                value={v.stock}
                onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
              />
              <input
                placeholder="SKU suffix"
                className="form-input w-28"
                value={v.sku_suffix}
                onChange={(e) => updateVariant(i, 'sku_suffix', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="p-1.5 text-taupe-200 hover:text-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs font-sans text-taupe-300 hover:text-charcoal-300 transition-colors">
          <Plus size={14} /> Add size
        </button>
      </section>

      {/* Images */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-4">
        <h2 className="font-serif text-xl text-charcoal-300">Images</h2>
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="relative w-24 h-28 bg-beige-100 rounded overflow-hidden">
                  <Image src={img.url} alt={img.alt_text ?? 'Product image'} fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img)}
                  disabled={deletingImageId === img.id}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="form-label">Upload Images</label>
          <input
            ref={fileRef}
            type="file"
            name="images"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-2 text-xs font-sans text-charcoal-200"
          />
          <p className="text-xs text-taupe-200 mt-1">JPG, PNG, WebP, AVIF — max 10 MB each</p>
        </div>
      </section>

      {/* Flags */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-3">
        <h2 className="font-serif text-xl text-charcoal-300">Visibility &amp; Flags</h2>
        {flagItems.map(({ name, label }) => (
          <label key={name} className="flex items-center gap-3 text-sm font-sans cursor-pointer">
            <input
              type="checkbox"
              checked={flags[name]}
              onChange={(e) => setFlags((prev) => ({ ...prev, [name]: e.target.checked }))}
              className="accent-charcoal-300 w-4 h-4"
            />
            {label}
          </label>
        ))}
      </section>

      {/* Message */}
      {msgType && (
        <p role="status" className={msgType === 'error' ? 'text-sm font-sans text-red-600' : 'text-sm font-sans text-green-700'}>
          {msgText}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={saving} disabled={archiving}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
        {isEdit && !product.is_archived && (
          <Button type="button" variant="secondary" onClick={handleArchive} loading={archiving} disabled={saving}>
            Archive Product
          </Button>
        )}
      </div>
    </form>
  )
}