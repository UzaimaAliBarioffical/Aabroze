/**
 * JazzCash Payment Service
 * ⚠️  All sensitive operations are server-side only.
 * Never import this in client components.
 */
import crypto from 'crypto'

interface JazzCashConfig {
  merchantId: string
  password: string
  integritySalt: string
  sandbox: boolean
}

interface JazzCashPaymentParams {
  orderId: string
  amount: number // in PKR — will be converted to paisa
  description: string
  customerEmail?: string
  customerPhone?: string
  returnUrl: string
  cancelUrl: string
}

interface JazzCashResponse {
  success: boolean
  redirectUrl: string
  formData: Record<string, string>
  error?: string
}

function getConfig(): JazzCashConfig {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID
  const password = process.env.JAZZCASH_PASSWORD
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT

  if (!merchantId || !password || !integritySalt) {
    throw new Error(
      'JazzCash credentials not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT environment variables.'
    )
  }

  return {
    merchantId,
    password,
    integritySalt,
    sandbox: process.env.JAZZCASH_SANDBOX !== 'false',
  }
}

function getJazzCashBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
    : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
}

function formatAmount(pkrAmount: number): string {
  // JazzCash expects amount in paisa (PKR × 100)
  return String(Math.round(pkrAmount * 100))
}

function generateTxnDateTime(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`
}

function generateExpiryDateTime(): string {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hrs
  const yyyy = expires.getFullYear()
  const mm = String(expires.getMonth() + 1).padStart(2, '0')
  const dd = String(expires.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}235959`
}

/**
 * Generate HMAC-SHA256 integrity hash for JazzCash.
 * Fields must be sorted alphabetically and joined with '&'.
 */
function generateHash(params: Record<string, string>, integritySalt: string): string {
  const sortedKeys = Object.keys(params).sort()
  const hashString = integritySalt + '&' + sortedKeys.map((k) => params[k]).join('&')
  return crypto.createHmac('sha256', integritySalt).update(hashString).digest('hex')
}

/**
 * Initiate a JazzCash payment.
 * Returns a redirect URL and form data for POST redirection.
 */
export async function initiateJazzCashPayment(
  params: JazzCashPaymentParams
): Promise<JazzCashResponse> {
  try {
    const config = getConfig()
    const txnDateTime = generateTxnDateTime()
    const expiryDateTime = generateExpiryDateTime()
    const txnRefNo = `T${params.orderId.replace(/-/g, '').slice(0, 18)}`
    const amountPaisa = formatAmount(params.amount)

    const formParams: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: config.merchantId,
      pp_Password: config.password,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: amountPaisa,
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: params.orderId,
      pp_Description: params.description.slice(0, 100),
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_ReturnURL: params.returnUrl,
      pp_SecureHash: '',
    }

    if (params.customerEmail) {
      formParams.pp_CustomerEmail = params.customerEmail
    }
    if (params.customerPhone) {
      formParams.pp_CustomerMobileNo = params.customerPhone
    }

    // Remove hash from params before hashing
    const { pp_SecureHash: _unused, ...hashParams } = formParams
    void _unused
    formParams.pp_SecureHash = generateHash(hashParams, config.integritySalt)

    return {
      success: true,
      redirectUrl: getJazzCashBaseUrl(config.sandbox),
      formData: formParams,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JazzCash initiation failed'
    console.error('[JazzCash] Initiation error:', message)
    return { success: false, redirectUrl: '', formData: {}, error: message }
  }
}

/**
 * Verify a JazzCash callback / webhook.
 * Validates the integrity hash to confirm the response is authentic.
 */
export function verifyJazzCashCallback(
  callbackParams: Record<string, string>
): { valid: boolean; responseCode: string; message: string } {
  try {
    const config = getConfig()
    const receivedHash = callbackParams['pp_SecureHash']
    if (!receivedHash) {
      return { valid: false, responseCode: '', message: 'Missing secure hash' }
    }

    const { pp_SecureHash: _hash, ...paramsToVerify } = callbackParams
    void _hash
    const computedHash = generateHash(paramsToVerify, config.integritySalt)

    if (computedHash !== receivedHash) {
      console.warn('[JazzCash] Hash mismatch — possible tampering')
      return { valid: false, responseCode: '', message: 'Hash verification failed' }
    }

    const responseCode = callbackParams['pp_ResponseCode'] ?? ''
    const isSuccess = responseCode === '000'

    return {
      valid: true,
      responseCode,
      message: isSuccess ? 'Payment successful' : `Payment failed (code: ${responseCode})`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed'
    console.error('[JazzCash] Callback verification error:', message)
    return { valid: false, responseCode: '', message }
  }
}
