/**
 * verify-et.ts — Server-side verify.et API client
 *
 * This module handles all interactions with the verify.et payment
 * verification API. It is NEVER imported on the client side.
 *
 * Key responsibilities:
 * - Bank configuration (required fields, labels, availability)
 * - Building bank-specific request bodies
 * - Calling POST https://verify.et/api/verify?waitMs=7000
 * - Returning typed results with safe error handling
 */

// ─── Bank Configuration ────────────────────────────────────────────

export type BankCode =
  | 'cbe'
  | 'boa'
  | 'telebirr'
  | 'mpesa'
  | 'cbebirr'
  | 'dashen'
  | 'awash'
  | 'siinqee'
  | 'kaafiebirr';

export interface BankFieldConfig {
  /** Bank code sent to verify.et */
  code: BankCode;
  /** Human-readable bank name */
  name: string;
  /** The primary reference field label shown to the student */
  referenceLabel: string;
  /** The field name sent to verify.et for the primary reference */
  referenceFieldName: 'referenceNumber' | 'transactionNumber' | 'receiptNumber';
  /** Whether a phone number field is also required */
  requiresPhone: boolean;
  /** Whether this bank requires an accountSuffix in the API request */
  requiresAccountSuffix: boolean;
  /** How many digits the account suffix must be (if required) */
  accountSuffixLength?: number;
  /** Env var name for the account suffix (if required) */
  accountSuffixEnvVar?: string;
  /** Whether this bank is currently available for verification */
  available: boolean;
  /** Optional unavailability message */
  unavailableMessage?: string;
}

export const BANK_CONFIG: Record<BankCode, BankFieldConfig> = {
  cbe: {
    code: 'cbe',
    name: 'Commercial Bank of Ethiopia (CBE)',
    referenceLabel: 'CBE Reference Number (FT...)',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: true,
    accountSuffixLength: 8,
    accountSuffixEnvVar: 'VERIFY_ET_CBE_SUFFIX',
    available: true,
  },
  boa: {
    code: 'boa',
    name: 'Bank of Abyssinia (BOA)',
    referenceLabel: 'BOA Reference Number',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: true,
    accountSuffixLength: 5,
    accountSuffixEnvVar: 'VERIFY_ET_BOA_SUFFIX',
    available: true,
  },
  telebirr: {
    code: 'telebirr',
    name: 'Telebirr',
    referenceLabel: 'Transaction Number',
    referenceFieldName: 'transactionNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: false,
    unavailableMessage:
      'Telebirr verification is currently unavailable due to an upstream issue from Ethio Telecom. Please use another payment method or wait for it to be restored.',
  },
  mpesa: {
    code: 'mpesa',
    name: 'M-Pesa',
    referenceLabel: 'Transaction Number',
    referenceFieldName: 'transactionNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: true,
  },
  cbebirr: {
    code: 'cbebirr',
    name: 'CBE Birr',
    referenceLabel: 'Receipt Number',
    referenceFieldName: 'receiptNumber',
    requiresPhone: true,
    requiresAccountSuffix: false,
    available: true,
  },
  dashen: {
    code: 'dashen',
    name: 'Dashen Bank',
    referenceLabel: 'Reference Number',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: true,
  },
  awash: {
    code: 'awash',
    name: 'Awash Bank',
    referenceLabel: 'Reference Number',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: true,
  },
  siinqee: {
    code: 'siinqee',
    name: 'Siinqee Bank',
    referenceLabel: 'Reference Number',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: true,
  },
  kaafiebirr: {
    code: 'kaafiebirr',
    name: 'Kaafi Ebirr',
    referenceLabel: 'Reference Number',
    referenceFieldName: 'referenceNumber',
    requiresPhone: false,
    requiresAccountSuffix: false,
    available: true,
  },
};

/** Ordered list of bank codes for UI display */
export const BANK_ORDER: BankCode[] = [
  'cbe', 'boa', 'telebirr', 'mpesa', 'cbebirr',
  'dashen', 'awash', 'siinqee', 'kaafiebirr',
];

// ─── Verify.et API Types ────────────────────────────────────────────

export interface VerifyEtResult {
  /** Whether the verification call itself was successful (200 response) */
  apiSuccess: boolean;
  /** Whether the payment was verified as valid */
  verified: boolean;
  /** Amount from verify.et response (in ETB, as number) */
  amount?: number;
  /** The requestId for tracking/webhooks */
  requestId?: string;
  /** Whether the settlement account matched */
  settlementMatched?: boolean;
  /** High-level status */
  status: 'success' | 'failed' | 'queued' | 'error';
  /** Human-readable rejection reason (if applicable) */
  rejectionReason?: string;
  /** Raw response for logging */
  rawResponse?: unknown;
}

// ─── API Call ────────────────────────────────────────────────────────

/**
 * Call the verify.et API to verify a bank payment.
 *
 * @param bankCode   The bank code (e.g. 'cbe', 'boa')
 * @param reference  The reference/transaction/receipt number
 * @param options    Additional options (phone, idempotencyKey)
 * @returns          A typed VerifyEtResult — never throws
 */
export async function verifyPayment(
  bankCode: BankCode,
  reference: string,
  options: {
    phone?: string;
    idempotencyKey: string;
    expectedAmount: number;
  }
): Promise<VerifyEtResult> {
  const apiKey = process.env.VERIFY_ET_API_KEY;
  if (!apiKey) {
    console.warn('[verify-et] VERIFY_ET_API_KEY not set, falling back to manual review');
    return { apiSuccess: false, verified: false, status: 'error' };
  }

  const config = BANK_CONFIG[bankCode];
  if (!config) {
    console.error(`[verify-et] Unknown bank code: ${bankCode}`);
    return { apiSuccess: false, verified: false, status: 'error' };
  }

  // Build request body
  const body: Record<string, string> = { bank: bankCode };

  // Set the reference field with the correct name for this bank
  body[config.referenceFieldName] = reference;

  // Add accountSuffix if required
  if (config.requiresAccountSuffix && config.accountSuffixEnvVar) {
    const suffix = process.env[config.accountSuffixEnvVar];
    if (!suffix) {
      console.warn(
        `[verify-et] ${config.accountSuffixEnvVar} not set for ${bankCode}, falling back to manual review`
      );
      return { apiSuccess: false, verified: false, status: 'error' };
    }
    body.accountSuffix = suffix;
  }

  // Add phone for CBE Birr
  if (config.requiresPhone && options.phone) {
    body.phone = options.phone;
  }

  // Build webhook URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/webhooks/verify-et`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'Idempotency-Key': options.idempotencyKey,
      'X-Webhook-Url': webhookUrl,
    };

    console.log(`[verify-et] Calling verify.et for ${bankCode} ref=${reference}`);

    const response = await fetch('https://verify.et/api/verify?waitMs=7000', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15s total timeout
    });

    const responseData = await response.json();

    console.log(`[verify-et] Response status=${response.status}`, JSON.stringify(responseData));

    // Extract the requestId from the response
    const requestId = responseData?.requestId || null;

    // ── Case C: 202 Queued ──────────────────────────────────────
    if (response.status === 202) {
      return {
        apiSuccess: true,
        verified: false,
        requestId,
        status: 'queued',
        rawResponse: responseData,
      };
    }

    // ── Not 200: unexpected status ──────────────────────────────
    if (!response.ok) {
      console.warn(`[verify-et] Unexpected status ${response.status}:`, responseData);
      return {
        apiSuccess: false,
        verified: false,
        requestId,
        status: 'error',
        rawResponse: responseData,
      };
    }

    // ── 200 Response ────────────────────────────────────────────
    const verification = responseData?.verification || responseData;
    const dataArray = responseData?.data || verification?.data;
    const firstData = Array.isArray(dataArray) ? dataArray[0] : dataArray;

    const isVerified = verification?.verified === true || responseData?.verified === true;
    const responseAmount = firstData?.amount
      ? parseFloat(String(firstData.amount))
      : null;
    const settlementMatch = firstData?.settlementAccountMatch?.matched;

    // ── Case A: Verified + amount OK + settlement OK ────────────
    if (isVerified) {
      // Check amount
      if (responseAmount !== null && responseAmount < options.expectedAmount) {
        return {
          apiSuccess: true,
          verified: false,
          amount: responseAmount,
          requestId,
          settlementMatched: settlementMatch,
          status: 'failed',
          rejectionReason: `Amount paid (${responseAmount} ETB) does not match the required amount (${options.expectedAmount} ETB)`,
          rawResponse: responseData,
        };
      }

      // Check settlement account match (if present in response)
      if (settlementMatch === false) {
        return {
          apiSuccess: true,
          verified: false,
          amount: responseAmount ?? undefined,
          requestId,
          settlementMatched: false,
          status: 'failed',
          rejectionReason: 'Payment was not made to the correct account',
          rawResponse: responseData,
        };
      }

      // All checks passed — auto-approve
      return {
        apiSuccess: true,
        verified: true,
        amount: responseAmount ?? undefined,
        requestId,
        settlementMatched: settlementMatch ?? true,
        status: 'success',
        rawResponse: responseData,
      };
    }

    // ── Case B: verified: false ─────────────────────────────────
    return {
      apiSuccess: true,
      verified: false,
      amount: responseAmount ?? undefined,
      requestId,
      settlementMatched: settlementMatch,
      status: 'failed',
      rejectionReason: 'Transaction not found or could not be verified',
      rawResponse: responseData,
    };
  } catch (error: unknown) {
    // ── Case C: Network/timeout error ───────────────────────────
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[verify-et] Error calling verify.et API:`, message);
    return {
      apiSuccess: false,
      verified: false,
      status: 'error',
    };
  }
}

/**
 * Validate that a bank code is valid and supported.
 */
export function isValidBankCode(code: string): code is BankCode {
  return code in BANK_CONFIG;
}

/**
 * Check if a bank is currently available for verification.
 */
export function isBankAvailable(code: BankCode): boolean {
  return BANK_CONFIG[code]?.available ?? false;
}
