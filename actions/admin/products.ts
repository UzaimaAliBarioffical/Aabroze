'use server'

import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { productSchema, productVariantSchema } from '@/lib/zod-schemas'
import {
  uploadProductImage,
  deleteCloudinaryAsset,
  validateFileUpload,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from '@/lib/cloudinary'
import { slugify } from '@/lib/utils'

// ─── Create Product ────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  'use server'
  const supabase = await requireAdmin()

  const raw = Object.fromEntries(formData.entries())
  const parsed = productSchema.safeParse({
    name: raw.name,
    slug: raw.slug || slugify(String(raw.name)),
    sku: raw.sku || undefined,
    description: raw.description || undefined,
    fabric: raw.fabric || undefined,
    color: raw.color || undefined,
    care_instructions: raw.care_instructions || undefined,
    price: Number(raw.price),
    sale_price: raw.sale_price ? Number(raw.sale_price) : null,
    category_id: raw.category_id || null,
    is_featured: raw.is_featured === 'true',
    is_new_arrival: raw.is_new_arrival === 'true',
    is_published: raw.is_published === 'true',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({ ...parsed.data, is_archived: false })
    .select('id, slug')
    .single()

  if (insertError) return { error: 'Failed to create product. Slug may already be taken.' }

  // Parse variants
  const variantSizes = formData.getAll('variant_size')
  const variantStocks = formData.getAll('variant_stock')
  const variantSkus = formData.getAll('variant_sku_suffix')
  const variants = variantSizes
    .map((size, i) => productVariantSchema.safeParse({
      size: String(size),
      stock: Number(variantStocks[i] ?? 0),
      sku_suffix: String(variantSkus[i] ?? '') || undefined,
    }))
    .filter((r) => r.success)
    .map((r) => ({ ...(r as { success: true; data: { size: string; stock: number; sku_suffix?: string } }).data, product_id: product.id }))

  if (variants.length > 0) {
    await supabase.from('product_variants').insert(variants)
  }

  // Handle image uploads
  const imageFiles = formData.getAll('images') as File[]
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    if (!file || file.size === 0) continue
    const validation = validateFileUpload(file.type, file.size)
    if (!validation.valid) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      const result = await uploadProductImage(buffer, img--, product.slug)
      await supabase.from('product_images').insert({
        product_id: product.id,
        url: result.secure_url,
        cloudinary_public_id: result.public_id,
        display_order: i,
        is_video: false,
      })
    } catch {
      // Non-fatal
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  redirect(/admin/products//edit)
}

// ─── Update Product ────────────────────────────────────────────────
export async function updateProduct(productId: string, formData: FormData) {
  'use server'
  try {
    const supabase = await requireAdmin()
    const raw = Object.fromEntries(formData.entries())
    const parsed = productSchema.safeParse({
      name: raw.name,
      slug: raw.slug,
      sku: raw.sku || undefined,
      description: raw.description || undefined,
      fabric: raw.fabric || undefined,
      color: raw.color || undefined,
      care_instructions: raw.care_instructions || undefined,
      price: Number(raw.price),
      sale_price: raw.sale_price ? Number(raw.sale_price) : null,
      category_id: raw.category_id || null,
      is_featured: raw.is_featured === 'true',
      is_new_arrival: raw.is_new_arrival === 'true',
      is_published: raw.is_published === 'true',
    })

    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => i.message).join(', ') }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (updateError) return { error: 'Failed to update product.' }

    // Re-create variants
    await supabase.from('product_variants').delete().eq('product_id', productId)
    const variantSizes = formData.getAll('variant_size')
    const variantStocks = formData.getAll('variant_stock')
    const variantSkus = formData.getAll('variant_sku_suffix')
    const variants = variantSizes
      .map((size, i) => productVariantSchema.safeParse({
        size: String(size),
        stock: Number(variantStocks[i] ?? 0),
        sku_suffix: String(variantSkus[i] ?? '') || undefined,
      }))
      .filter((r) => r.success)
      .map((r) => ({ ...(r as { success: true; data: { size: string; stock: number; sku_suffix?: string } }).data, product_id: productId }))

    if (variants.length > 0) {
      await supabase.from('product_variants').insert(variants)
    }

    // Handle new image uploads
    const { data: existingProduct } = await supabase
      .from('products')
      .select('slug')
      .eq('id', productId)
      .single()

    const imageFiles = formData.getAll('images') as File[]
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1)

    let nextOrder = (existingImages?.[0]?.display_order ?? -1) + 1

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      if (!file || file.size === 0) continue
      const validation = validateFileUpload(file.type, file.size)
      if (!validation.valid) continue
      const buffer = Buffer.from(await file.arrayBuffer())
      try {
        const result = await uploadProductImage(
          buffer,
          img--,
          existingProduct?.slug ?? productId
        )
        await supabase.from('product_images').insert({
          product_id: productId,
          url: result.secure_url,
          cloudinary_public_id: result.public_id,
          display_order: nextOrder++,
          is_video: false,
        })
      } catch {
        // Non-fatal
      }
    }

    revalidatePath('/admin/products')
    revalidatePath(/admin/products//edit)
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    unstable_rethrow(err)
    return { error: 'An unexpected error occurred.' }
  }
}

// ─── Archive Product ───────────────────────────────────────────────
export async function archiveProduct(productId: string) {
  'use server'
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('products')
    .update({ is_archived: true, is_published: false })
    .eq('id', productId)
  if (error) return { error: 'Failed to archive product.' }
  revalidatePath('/admin/products')
  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── Delete Product Image ──────────────────────────────────────────
export async function deleteProductImage(imageId: string, cloudinaryPublicId: string | null) {
  'use server'
  const supabase = await requireAdmin()
  await supabase.from('product_images').delete().eq('id', imageId)
  if (cloudinaryPublicId) {
    try { await deleteCloudinaryAsset(cloudinaryPublicId) } catch { /* Non-fatal */ }
  }
  revalidatePath('/admin/products')
  return { success: true }
}
