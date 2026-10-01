// Payment form helpers: card brand detection, input formatting and validation.
// The payment page is UI-only — nothing here talks to a real gateway.

export const PAYMENT_METHODS = [
  { key: 'card', label: 'Credit / Debit card', short: 'Card', icon: '💳', hint: 'Visa, Mastercard, RuPay, Amex' },
  { key: 'upi', label: 'UPI', short: 'UPI', icon: '⚡', hint: 'Google Pay, PhonePe, Paytm, BHIM' },
  { key: 'wallet', label: 'Wallets', short: 'Wallet', icon: '👛', hint: 'Paytm, Amazon Pay, MobiKwik' },
]

export const methodTabId = (key) => `pay-tab-${key}`
export const methodPanelId = (key) => `pay-panel-${key}`

// UPI QR codes are valid for five minutes.
export const QR_TTL_MS = 5 * 60 * 1000
export const newQrExpiry = () => Date.now() + QR_TTL_MS
export const isQrExpired = (expiresAt) => expiresAt <= Date.now()

export const CARD_BRANDS = [
  { key: 'amex', label: 'Amex', pattern: /^3[47]/, groups: [4, 6, 5], cvv: 4 },
  { key: 'rupay', label: 'RuPay', pattern: /^(60|65|81|82|508)/, groups: [4, 4, 4, 4], cvv: 3 },
  { key: 'visa', label: 'Visa', pattern: /^4/, groups: [4, 4, 4, 4], cvv: 3 },
  { key: 'mastercard', label: 'Mastercard', pattern: /^(5[1-5]|2[2-7])/, groups: [4, 4, 4, 4], cvv: 3 },
]

const DEFAULT_BRAND = { key: 'card', label: 'Card', groups: [4, 4, 4, 4], cvv: 3 }

export const UPI_APPS = [
  { key: 'gpay', label: 'Google Pay', handle: 'okaxis', color: '#4285f4' },
  { key: 'phonepe', label: 'PhonePe', handle: 'ybl', color: '#5f259f' },
  { key: 'paytm', label: 'Paytm', handle: 'paytm', color: '#00b9f1' },
  { key: 'bhim', label: 'BHIM', handle: 'upi', color: '#f47920' },
]

// Mock balances so one wallet can't cover a typical booking (to show the failure path).
export const WALLETS = [
  { key: 'paytm', label: 'Paytm Wallet', balance: 2450, color: '#00b9f1' },
  { key: 'amazonpay', label: 'Amazon Pay', balance: 1280, color: '#ff9900' },
  { key: 'phonepe', label: 'PhonePe Wallet', balance: 860, color: '#5f259f' },
  { key: 'mobikwik', label: 'MobiKwik', balance: 150, color: '#2f6fe4' },
]

// Test values that make the mock gateway decline the payment.
export const TEST_DECLINE = { card: '4000 0000 0000 0002', upi: 'fail@upi' }

const digits = (value) => value.replace(/\D/g, '')

export const cardBrand = (number) => CARD_BRANDS.find((b) => b.pattern.test(digits(number))) ?? DEFAULT_BRAND

/** Group card digits for display as the user types: "4111111111" -> "4111 1111 11". */
export function formatCardNumber(value) {
  const raw = digits(value)
  const { groups } = cardBrand(raw)
  const max = groups.reduce((a, b) => a + b, 0)
  const parts = []
  let i = 0
  for (const size of groups) {
    if (i >= Math.min(raw.length, max)) break
    parts.push(raw.slice(i, i + size))
    i += size
  }
  return parts.join(' ')
}

/** "0427" -> "04/27"; a leading 2–9 becomes "0x/". */
export function formatExpiry(value, previous = '') {
  let raw = digits(value).slice(0, 4)
  if (raw.length === 1 && raw > '1') raw = `0${raw}`
  // Let backspace remove the slash instead of it being re-added immediately.
  if (raw.length === 2 && previous.length === 3 && value.length === 2) return raw
  return raw.length >= 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw
}

function luhnValid(number) {
  let sum = 0
  ;[...number].reverse().forEach((ch, i) => {
    let n = Number(ch)
    if (i % 2) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  })
  return sum % 10 === 0
}

export function validateCard({ number, name, expiry, cvv }, now = new Date()) {
  const errors = {}
  const raw = digits(number)
  const brand = cardBrand(raw)
  const length = brand.groups.reduce((a, b) => a + b, 0)

  if (!raw) errors.number = 'Card number is required'
  else if (raw.length !== length || !luhnValid(raw)) errors.number = 'Enter a valid card number'

  if (!name.trim()) errors.name = 'Name on card is required'
  else if (!/^[A-Za-z\s.'-]{2,}$/.test(name.trim())) errors.name = 'Use letters only, as printed on the card'

  const m = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!expiry) errors.expiry = 'Expiry is required'
  else if (!m || +m[1] < 1 || +m[1] > 12) errors.expiry = 'Use MM/YY'
  else {
    // Cards are valid through the last day of the expiry month.
    const endOfMonth = new Date(2000 + +m[2], +m[1], 1)
    if (endOfMonth <= now) errors.expiry = 'This card has expired'
  }

  if (!cvv) errors.cvv = 'CVV is required'
  else if (!new RegExp(`^\\d{${brand.cvv}}$`).test(cvv)) errors.cvv = `Enter the ${brand.cvv}-digit CVV`

  return errors
}

const VPA_RE = /^[a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63}$/i

export function validateUpiId(vpa) {
  if (!vpa.trim()) return 'UPI ID is required'
  if (!VPA_RE.test(vpa.trim())) return 'Enter a valid UPI ID, e.g. name@okhdfc'
  return ''
}

export const maskCard = (number) => `•••• ${digits(number).slice(-4)}`
