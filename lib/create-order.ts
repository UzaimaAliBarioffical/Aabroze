import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  checkoutCartSchema,
  checkoutSchema,
  type CheckoutInput,
} from '@/lib/zod-schemas'
import {
  generateOrderNumber,
  getDeliveryCharges,
  isFreeShipping,
} from '@/lib/utils'
import {
  getVariantUnitPrice,
  isUuid,
  toMoney,
} from '@/lib/pricing'
import {
  sendCustomerOrderConfirmation,
  sendOwnerOrderNotification,
} from '@/lib/email'
import { sendOwnerWhatsAppNotification } from '@/lib/whatsapp'
import type {
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  ProductVariant,
} from '@/types'

export interface PlaceOrderPayload {
  customer: CheckoutInput
  items: {
    product_id: string
    variant_id: string
    quantity: number
  }[]
  userId?: string | null
}

export interface PlaceOrderResult {
  success: boolean
  duplicate?: boolean
  error?: string
  order?: Order & { items: OrderItem[] }
}

interface VariantRow extends ProductVariant {
  product: Product | null
}

export async function placeStoreOrder(
  payload: PlaceOrderPayload
): Promise<PlaceOrderResult> {
  const customerParsed = checkoutSchema.safeParse(payload.customer)

  if (!customerParsed.success) {
    return {
      success: false,
      error:
        customerParsed.error.issues[0]?.message ??
        'Invalid customer details',
    }
  }

  const cartParsed = checkoutCartSchema.safeParse(payload.items)

  if (!cartParsed.success) {
    return {
      success: false,
      error:
        cartParsed.error.issues[0]?.message ??
        'Invalid cart',
    }
  }

  const customer = customerParsed.data
  const items = cartParsed.data
  const admin = createSupabaseAdminClient()

  // ---------------------------------------------------------
  // IDEMPOTENCY CHECK
  // ---------------------------------------------------------

  const { data: existing } = await admin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('idempotency_key', customer.idempotency_key)
    .maybeSingle()

  if (existing) {
    return {
      success: true,
      duplicate: true,
      order: existing as Order & { items: OrderItem[] },
    }
  }

  // ---------------------------------------------------------
  // LOAD VARIANTS + PRODUCTS FROM DATABASE
  // ---------------------------------------------------------

  const variantIds = [
    ...new Set(items.map((item) => item.variant_id)),
  ]

  const {
    data: variantRows,
    error: variantError,
  } = await admin
    .from('product_variants')
    .select('*, product:products(*, images:product_images(*))')
    .in('id', variantIds)

  if (variantError || !variantRows) {
    console.error(
      '[orders] Failed to load variants:',
      variantError?.message
    )

    return {
      success: false,
      error:
        'Unable to validate products. Please try again.',
    }
  }

  const variants =
    variantRows as unknown as VariantRow[]

  const variantMap = new Map(
    variants.map((variant) => [
      variant.id,
      variant,
    ])
  )

  // ---------------------------------------------------------
  // SERVER-SIDE PRODUCT / STOCK / PRICE VALIDATION
  // ---------------------------------------------------------

  const prepared: {
    product_id: string
    variant_id: string
    product_name: string
    size: string
    quantity: number
    unit_price: number
    total_price: number
    image_url: string | null
    current_stock: number
  }[] = []

  let subtotal = 0

  for (const item of items) {
    if (
      !isUuid(item.product_id) ||
      !isUuid(item.variant_id)
    ) {
      return {
        success: false,
        error: 'Invalid product selection',
      }
    }

    const variant =
      variantMap.get(item.variant_id)

    const productRaw = variant?.product

    const product = Array.isArray(productRaw)
      ? productRaw[0]
      : productRaw

    if (!variant || !product) {
      return {
        success: false,
        error:
          'One or more products are no longer available',
      }
    }

    if (variant.product_id !== item.product_id) {
      return {
        success: false,
        error: 'Product and size do not match',
      }
    }

    if (
      !product.is_published ||
      product.is_archived
    ) {
      return {
        success: false,
        error: `${product.name} is not available`,
      }
    }

    if (variant.stock < item.quantity) {
      return {
        success: false,
        error: `${product.name} (${variant.size}) does not have enough stock`,
      }
    }

    const unit_price =
      getVariantUnitPrice(product, variant)

    const total_price = toMoney(
      unit_price * item.quantity
    )

    subtotal = toMoney(
      subtotal + total_price
    )

    prepared.push({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      size: variant.size,
      quantity: item.quantity,
      unit_price,
      total_price,
      image_url:
        product.images?.[0]?.url ?? null,
      current_stock: variant.stock,
    })
  }

  // ---------------------------------------------------------
  // ORDER TOTAL
  // ---------------------------------------------------------

  const delivery_charges =
    isFreeShipping(subtotal)
      ? 0
      : getDeliveryCharges(
          customer.province
        )

  const total = toMoney(
    subtotal + delivery_charges
  )

  const order_number =
    generateOrderNumber()

  // ---------------------------------------------------------
  // CREATE ORDER
  // ---------------------------------------------------------

  const {
    data: orderRow,
    error: orderError,
  } = await admin
    .from('orders')
    .insert({
      order_number,
      user_id: payload.userId ?? null,

      customer_name:
        customer.full_name,

      customer_email:
        customer.email,

      customer_phone:
        customer.phone,

      customer_whatsapp:
        customer.whatsapp || null,

      province:
        customer.province,

      city:
        customer.city,

      address:
        customer.address,

      postal_code:
        customer.postal_code || null,

      order_notes:
        customer.order_notes || null,

      subtotal,
      delivery_charges,
      total,

      payment_method:
        customer.payment_method as PaymentMethod,

      payment_status: 'unpaid',

      status: 'pending',

      idempotency_key:
        customer.idempotency_key,
    })
    .select()
    .single()

  // ---------------------------------------------------------
  // ORDER INSERT ERROR / DUPLICATE
  // ---------------------------------------------------------

  if (orderError || !orderRow) {
    if (orderError?.code === '23505') {
      const { data: replay } =
        await admin
          .from('orders')
          .select(
            '*, items:order_items(*)'
          )
          .eq(
            'idempotency_key',
            customer.idempotency_key
          )
          .maybeSingle()

      if (replay) {
        return {
          success: true,
          duplicate: true,
          order:
            replay as Order & {
              items: OrderItem[]
            },
        }
      }
    }

    console.error(
      '[orders] Insert failed:',
      orderError?.message
    )

    return {
      success: false,
      error:
        'Could not create order. Please try again.',
    }
  }

  // ---------------------------------------------------------
  // CREATE ORDER ITEMS
  // ---------------------------------------------------------

  const orderItemsPayload =
    prepared.map((row) => ({
      order_id: orderRow.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      product_name: row.product_name,

      // Required by database
      size: row.size,

      quantity: row.quantity,
      unit_price: row.unit_price,
      total_price: row.total_price,
      image_url: row.image_url,
    }))

  const {
    data: insertedItems,
    error: itemsError,
  } = await admin
    .from('order_items')
    .insert(orderItemsPayload)
    .select()

  if (itemsError) {
    console.error(
      '[orders] Items insert failed:',
      itemsError.message
    )

    await admin
      .from('orders')
      .delete()
      .eq('id', orderRow.id)

    return {
      success: false,
      error:
        'Could not save order items. Please try again.',
    }
  }

  // ---------------------------------------------------------
  // DECREMENT STOCK
  // ---------------------------------------------------------

  for (const row of prepared) {
    const {
      data: decremented,
      error: rpcError,
    } = await admin.rpc(
      'decrement_variant_stock',
      {
        p_variant_id:
          row.variant_id,
        p_qty:
          row.quantity,
      }
    )

    let stockOk =
      decremented === true

    // Fallback if RPC migration has not
    // been installed yet.
    if (rpcError) {
      console.warn(
        '[orders] Stock RPC unavailable, using fallback update:',
        rpcError.message
      )

      const {
        data: stockUpdate,
        error: stockError,
      } = await admin
        .from('product_variants')
        .update({
          stock:
            row.current_stock -
            row.quantity,
        })
        .eq(
          'id',
          row.variant_id
        )
        .gte(
          'stock',
          row.quantity
        )
        .select('id')

      stockOk =
        !stockError &&
        !!stockUpdate &&
        stockUpdate.length > 0
    }

    if (!stockOk) {
      console.error(
        '[orders] Stock decrement failed for',
        row.variant_id
      )

      await admin
        .from('order_items')
        .delete()
        .eq(
          'order_id',
          orderRow.id
        )

      await admin
        .from('orders')
        .delete()
        .eq(
          'id',
          orderRow.id
        )

      return {
        success: false,
        error:
          'Stock changed while placing your order. Please review your cart.',
      }
    }
  }

  // ---------------------------------------------------------
  // PAYMENT RECORD
  // ---------------------------------------------------------

  const { error: paymentError } =
    await admin
      .from('payments')
      .insert({
        order_id:
          orderRow.id,

        gateway:
          customer.payment_method,

        amount:
          total,

        currency:
          'PKR',

        status:
          'unpaid',
      })

  if (paymentError) {
    console.error(
      '[orders] Payment record insert failed:',
      paymentError.message
    )
  }

  // ---------------------------------------------------------
  // FINAL ORDER
  // ---------------------------------------------------------

  const fullOrder = {
    ...(orderRow as Order),

    items:
      (insertedItems as OrderItem[]) ??
      [],
  }

  // ---------------------------------------------------------
  // OWNER EMAIL
  // ---------------------------------------------------------

  try {
    await sendOwnerOrderNotification(
      fullOrder
    )
  } catch (err) {
    console.error(
      '[orders] Owner email failed after order save:',
      err
    )
  }

  // ---------------------------------------------------------
  // CUSTOMER EMAIL
  // ---------------------------------------------------------

  try {
    await sendCustomerOrderConfirmation(
      fullOrder
    )
  } catch (err) {
    console.error(
      '[orders] Customer email failed after order save:',
      err
    )
  }

  // ---------------------------------------------------------
  // OWNER WHATSAPP
  // ---------------------------------------------------------

  try {
    await sendOwnerWhatsAppNotification(
      fullOrder
    )
  } catch (err) {
    console.error(
      '[orders] Owner WhatsApp failed after order save:',
      err
    )
  }

  return {
    success: true,
    order: fullOrder,
  }
}