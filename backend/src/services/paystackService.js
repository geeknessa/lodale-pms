/**
 * Paystack Integration Service for Lodale
 * Handles subaccount creation/updates, split payments, transaction initialization, and verification.
 */

import { PLATFORM_FEE_PERCENT } from '../utils/statusConstants.js';
export { PLATFORM_FEE_PERCENT };

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getSecretKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return key ? key.trim() : '';
};

const getHeaders = () => {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error('Paystack secret key is missing. Please configure PAYSTACK_SECRET_KEY in backend/.env');
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Standard HTTP fetch wrapper for Paystack API with safety timeout and comprehensive error logging
 */
export async function paystackFetch(endpoint, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const url = endpoint.startsWith('http') ? endpoint : `${PAYSTACK_BASE_URL}${endpoint}`;

  try {
    const headers = {
      ...getHeaders(),
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[Paystack Error] Non-JSON response from ${url} (HTTP ${res.status}):`, text.slice(0, 500));
      const err = new Error(`Paystack API returned an invalid response (HTTP ${res.status})`);
      err.status = res.status;
      throw err;
    }

    if (!res.ok || data?.status === false) {
      console.error(`[Paystack API Error] HTTP ${res.status} from ${url}:`, JSON.stringify(data, null, 2));
      const errMsg = data?.message || `Paystack request failed with status ${res.status}`;
      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[Paystack Timeout] Call to ${url} timed out after ${timeoutMs}ms`);
      const timeoutErr = new Error(`Paystack service request timed out after ${Math.round(timeoutMs / 1000)}s. Please try again.`);
      timeoutErr.status = 504;
      timeoutErr.code = 'PAYSTACK_TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// In-memory cache for Nigerian banks list (1 hour TTL)
let cachedBanks = null;
let banksLastFetched = 0;

/**
 * Fetch Nigerian banks from Paystack
 */
export async function listBanks() {
  const now = Date.now();
  if (cachedBanks && now - banksLastFetched < 60 * 60 * 1000) {
    return cachedBanks;
  }

  const data = await paystackFetch('/bank?country=nigeria&perPage=300');
  if (!data.status || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to retrieve banks from Paystack');
  }

  cachedBanks = data.data;
  banksLastFetched = now;
  return cachedBanks;
}

// Comprehensive Nigerian Bank Aliases mapping commonly used names/abbreviations to verified Paystack codes
const BANK_ALIASES = {
  gtb: '058',
  gtbank: '058',
  'gt bank': '058',
  'guaranty trust': '058',
  'guaranty trust bank': '058',
  fbn: '011',
  'first bank': '011',
  'first bank of nigeria': '011',
  access: '044',
  'access bank': '044',
  zenith: '057',
  'zenith bank': '057',
  uba: '033',
  'united bank for africa': '033',
  kuda: '50211',
  'kuda bank': '50211',
  'kuda microfinance bank': '50211',
  opay: '999992',
  'opay digital services limited (opay)': '999992',
  palmpay: '999991',
  moniepoint: '50515',
  'moniepoint mfb': '50515',
  stanbic: '221',
  'stanbic ibtc': '221',
  'stanbic ibtc bank': '221',
  fcmb: '214',
  'first city monument bank': '214',
  sterling: '232',
  'sterling bank': '232',
  polaris: '076',
  'polaris bank': '076',
  wema: '035',
  'wema bank': '035',
  alat: '035',
  union: '032',
  'union bank': '032',
  unity: '215',
  'unity bank': '215',
  providus: '101',
  'providus bank': '101',
  jaiz: '301',
  'jaiz bank': '301',
  taj: '302',
  'taj bank': '302',
  lotus: '303',
  'lotus bank': '303',
  keystone: '082',
  'keystone bank': '082',
  heritage: '030',
  'heritage bank': '030',
  vfd: '566',
  'vfd microfinance bank': '566',
  rubies: '125',
  'rubies mfb': '125'
};

/**
 * Resolve bank code from either a direct bank code or bank name string
 */
export async function resolveBankCode(bankCodeOrName) {
  if (!bankCodeOrName || typeof bankCodeOrName !== 'string') return null;

  const trimmed = bankCodeOrName.trim();
  // If it's already a numeric bank code (e.g. "058", "044")
  if (/^\d{3,6}$/.test(trimmed)) {
    return trimmed;
  }

  const normalizedQuery = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct alias check
  if (BANK_ALIASES[normalizedQuery]) {
    return BANK_ALIASES[normalizedQuery];
  }

  const banks = await listBanks();

  // 2. Exact normalized name match
  const exact = banks.find(
    (b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery
  );
  if (exact) return exact.code;

  // 3. Exact slug match
  const slugMatch = banks.find(
    (b) => (b.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery
  );
  if (slugMatch) return slugMatch.code;

  // 4. Substring or inclusion match
  const match = banks.find((b) => {
    const bName = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const bSlug = (b.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return bName.includes(normalizedQuery) || normalizedQuery.includes(bName) || bSlug.includes(normalizedQuery);
  });

  if (match) return match.code;

  return null;
}

/**
 * Create or update a Paystack subaccount for a landlord
 */
export async function createOrUpdateSubaccount({
  businessName,
  bankCodeOrName,
  accountNumber,
  subaccountCode,
}) {
  const bankCode = await resolveBankCode(bankCodeOrName);
  if (!bankCode) {
    throw new Error(`Could not resolve Paystack bank code for "${bankCodeOrName}". Please select a verified bank from the list.`);
  }

  const cleanAccountNumber = String(accountNumber || '').replace(/\D/g, '').trim();
  if (cleanAccountNumber.length !== 10) {
    throw new Error('Bank account number must be exactly 10 digits for Nigerian NUBAN');
  }

  const cleanBusinessName = (businessName || 'Lodale Landlord').trim();

  // If existing subaccount code is provided, try updating it
  if (subaccountCode) {
    try {
      const updateData = await paystackFetch(`/subaccount/${encodeURIComponent(subaccountCode)}`, {
        method: 'PUT',
        body: JSON.stringify({
          business_name: cleanBusinessName,
          settlement_bank: bankCode,
          account_number: cleanAccountNumber,
        }),
      });

      if (updateData.status && updateData.data?.subaccount_code) {
        return updateData.data;
      }
    } catch (updateErr) {
      console.warn(`[Paystack] Subaccount update failed for ${subaccountCode}, creating new:`, updateErr.message);
    }
  }

  // Create new subaccount
  const createData = await paystackFetch('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: cleanBusinessName,
      settlement_bank: bankCode,
      account_number: cleanAccountNumber,
      percentage_charge: 0,
    }),
  });

  if (!createData.status || !createData.data) {
    throw new Error(createData.message || 'Failed to create Paystack subaccount');
  }

  return createData.data;
}

/**
 * Initialize a split transaction on Paystack
 * Platform fee is 3.5% (Lodale absorbs Paystack charges from this 3.5%)
 */
export async function initializeTransaction({
  email,
  amountKobo,
  reference,
  subaccountCode,
  transactionChargeKobo,
  metadata,
  callbackUrl,
}) {
  if (!email) throw new Error('Customer email is required for Paystack transaction');
  if (!amountKobo || amountKobo <= 0) throw new Error('Transaction amount in kobo must be greater than zero');
  if (!reference) throw new Error('Transaction reference is required');

  const payload = {
    email: email.trim().toLowerCase(),
    amount: Math.round(amountKobo),
    reference: reference.trim(),
    callback_url: callbackUrl,
    metadata: metadata || {},
  };

  if (subaccountCode) {
    payload.subaccount = subaccountCode.trim();
    if (typeof transactionChargeKobo === 'number' && transactionChargeKobo >= 0) {
      payload.transaction_charge = Math.round(transactionChargeKobo);
    }
    // Lodale absorbs Paystack fees from the 3.5% platform fee
    payload.bearer = 'account';
  }

  const data = await paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!data.status || !data.data) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return data.data;
}

/**
 * Verify a transaction on Paystack by reference
 */
export async function verifyTransaction(reference) {
  if (!reference) throw new Error('Payment reference is required to verify transaction');

  const data = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference.trim())}`);

  if (!data.status || !data.data) {
    throw new Error(data.message || 'Paystack payment verification failed');
  }

  return data.data;
}

export const paystackService = {
  PLATFORM_FEE_PERCENT,
  paystackFetch,
  listBanks,
  resolveBankCode,
  createOrUpdateSubaccount,
  initializeTransaction,
  verifyTransaction,
};

export default paystackService;
