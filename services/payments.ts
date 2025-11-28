// services/payments.ts

// CHANGED: added 'paypal'
export type PaymentProvider = 'swish' | 'venmo' | 'cashapp' | 'paypal';

export interface SwishPaymentParams {
  phoneNumber: string;
  amount: number;
  message?: string;
}

export interface VenmoPaymentParams {
  username: string;
  amount: number;
  note?: string;
}

export interface CashAppPaymentParams {
  cashtag: string;
  amount: number;
  note?: string;
}

// CHANGED: include optional currency for PayPal.me
export interface PaypalPaymentParams {
  handle: string;            // paypal.me username / handle (can be full URL, @handle, or plain name)
  amount: number;
  currency?: string;         // NEW – e.g. "SEK", "USD", "EUR"
  note?: string;             // kept for future use if we ever want to encode it somehow
}

// Swish
export const buildSwishPaymentUrl = (params: SwishPaymentParams): string => {
  const { phoneNumber, amount, message = 'Veckopeng' } = params;

  const paymentData = {
    version: 1,
    payee: { value: phoneNumber },
    amount: { value: amount },
    message: { value: message },
  };

  return `swish://payment?data=${encodeURIComponent(
    JSON.stringify(paymentData),
  )}`;
};

// Venmo
export const buildVenmoPaymentUrl = (params: VenmoPaymentParams): string => {
  const { username, amount, note = 'Veckopeng' } = params;

  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(
    username,
  )}&amount=${encodeURIComponent(String(amount))}&note=${encodeURIComponent(
    note,
  )}`;
};

// Cash App
export const buildCashAppPaymentUrl = (
  params: CashAppPaymentParams,
): string => {
  const { cashtag, amount, note = 'Veckopeng' } = params;

  return `cashapp://send?amount=${encodeURIComponent(
    String(amount),
  )}&recipient=${encodeURIComponent(cashtag)}&note=${encodeURIComponent(
    note,
  )}`;
};

// CHANGED: PayPal.me with amount + currency like https://paypal.me/user/10USD
export const buildPaypalPaymentUrl = (params: PaypalPaymentParams): string => {
  const { handle, amount, currency } = params;

  // Normalise the handle so we always end up with just the username part.
  // This allows users to enter:
  //   - "gorber69"
  //   - "@gorber69"
  //   - "https://paypal.me/gorber69"
  //   - "https://www.paypal.com/paypalme/gorber69/"
  // and all of them become "gorber69".
  let cleaned = handle.trim();

  // Remove leading paypal.me / paypal.com/paypalme URL, if present
  cleaned = cleaned.replace(
    /^https?:\/\/(www\.)?paypal\.me\//i,
    '',
  );
  cleaned = cleaned.replace(
    /^https?:\/\/(www\.)?paypal\.com\/paypalme\//i,
    '',
  );

  // Remove leading @ if user typed @handle
  cleaned = cleaned.replace(/^@/, '');

  // If there are any extra path segments or trailing slashes, keep only the first segment
    cleaned = cleaned.split(/[/?#]/)[0];

  const amountStr = String(amount);

  // Default currency to SEK if not provided
  const currencyCode = (currency || 'SEK').toUpperCase(); // NEW

  // According to PayPal.me docs, amount + currency works like /10USD, /10SEK, etc.
  // Example: https://paypal.me/username/10USD
  // We'll use the canonical paypal.me domain here.
  return `https://paypal.me/${encodeURIComponent(
    cleaned,
  )}/${encodeURIComponent(amountStr + currencyCode)}`; // CHANGED
};
