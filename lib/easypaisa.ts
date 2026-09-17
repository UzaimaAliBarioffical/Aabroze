/**
 * Easypaisa Payment Service
 * ⚠️  Server-side only. Never import in client components.
 *
 * Easypaisa MA (Merchant Account) API integration.
 * Reference: Easypaisa MA API documentation v1.3
 */
import crypto from 'crypto'

interface EasypaisaConfig {
  storeId: string
  hashKey: string
  sandbox: boolean
}

interface EasypaisaPaymentParams {
  orderId: string
  amount: number
  description: string
  customerEmail?: string
  customerMobileNumber?: string
  returnUrl: string
  postBackUrl: string
}

interface EasypaisaResponse {
  success: boolean
  redirectUrl: string
  formData: Record<string, string>
  error?: string
}

function getConfig(): EasypaisaConfig {
  const storeId = process.env.EASYPAISA_STORE_ID
  const hashKey = process.env.EASYPAISA_HASH_KEY

  if (!storeId || !hashKey) {
    throw new Error(
      'Easypaisa credentials not configured. Set EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY environment variables.'
    )
  }

  return {
    storeId,
    hashKey,
    sandbox: process.env.EASYPAISA_SANDBOX !== 'false',
  }
}

function getEasypaisaBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
    : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
}

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Generate MD5 hash string for Easypaisa.
 * Format: amount&orderRefNum&paymentMethod&postBackURL&pp_Language&storeId&hashKey
 */
function generateEasypaisaHash(
  params: {
    amount: string
    orderRefNum: string
    paymentMethod: string
    postBackURL: string
    pp_Language: string
    storeId: string
  },
  hashKey: string
): string {
  const hashString = [
    params.amount,
    params.orderRefNum,
    params.paymentMethod,
    params.postBackURL,
    params.pp_Language,
    params.storeId,
    hashKey,
  ].join('&')
  return crypto.createHash('md5').update(hashString).digest('hex')
}

/**
 * Initiate Easypaisa web checkout.
 */
export async function initiateEasypaisaPayment(
  params: EasypaisaPaymentParams
): Promise<EasypaisaResponse> {
  try {
    const config = getConfig()
    const amount = formatAmount(params.amount)
    const orderRefNum = `EP${params.orderId.replace(/-/g, '').slice(0, 16).toUpperCase()}`

    const formParams = {
      storeId: config.storeId,
      amount,
      postBackURL: params.postBackUrl,
      orderRefNum,
      expiryDate: getExpiryDate(),
      autoRedirect: '0',
      pp_Language: 'EN',
      paymentMethod: 'MA_PAYMENT',
      paymentMethodMode: 'payment',
    }

    const secureHash = generateEasypaisaHash(
      {
        amount,
        orderRefNum,
        paymentMethod: formParams.paymentMethod,
        postBackURL: params.postBackUrl,
        pp_Language: 'EN',
        storeId: config.storeId,
      },
      config.hashKey
    )

    const finalParams: Record<string, string> = {
      ...formParams,
      hash: secureHash,
    }

    if (params.customerEmail) {
      finalParams.merchantPaymentMethod = 'MA_PAYMENT'
    }
    if (params.customerMobileNumber) {
      finalParams.msisdn = params.customerMobileNumber.replace(/^\+/, '')
    }

    return {
      success: true,
      redirectUrl: getEasypaisaBaseUrl(config.sandbox),
      formData: finalParams,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Easypaisa initiation failed'
    console.error('[Easypaisa] Initiation error:', message)
    return { success: false, redirectUrl: '', formData: {}, error: message }
  }
}

function getExpiryDate(): string {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return expires.toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * Verify Easypaisa postback (callback) response.
 */
export function verifyEasypaisaCallback(
  callbackParams: Record<string, string>
): { valid: boolean; status: string; message: string } {
  try {
    const config = getConfig()
    const receivedHash = callbackParams['hash']

    if (!receivedHash) {
      return { valid: false, status: '', message: 'Missing hash in callback' }
    }

    const { hash: _h, ...rest } = callbackParams
    void _h

    // Rebuild hash from callback params
    const computedHash = generateEasypaisaHash(
      {
        amount: rest['amount'] ?? '',
        orderRefNum: rest['orderRefNum'] ?? '',
        paymentMethod: rest['paymentMethod'] ?? '',
        postBackURL: rest['postBackURL'] ?? '',
        pp_Language: rest['pp_Language'] ?? 'EN',
        storeId: rest['storeId'] ?? config.storeId,
      },
      config.hashKey
    )

    if (computedHash !== receivedHash) {
      console.warn('[Easypaisa] Hash mismatch — possible tampering')
      return { valid: false, status: '', message: 'Hash verification failed' }
    }

    const status = callbackParams['status'] ?? ''
    const isSuccess = status === 'PAID'

    return {
      valid: true,
      status,
      message: isSuccess ? 'Payment successful' : `Payment failed (status: ${status})`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed'
    console.error('[Easypaisa] Callback verification error:', message)
    return { valid: false, status: '', message }
  }
}
