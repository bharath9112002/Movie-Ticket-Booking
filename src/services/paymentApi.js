// Mock payment gateway (UI only — no money moves). Approves everything except the
// test values in TEST_DECLINE and wallets without enough balance.

import { TEST_DECLINE, WALLETS, cardBrand, maskCard } from '../utils/payment'
import { MockApiError, respond } from './mockUtils'

const GATEWAY_LATENCY_MS = [1600, 2600]

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function transactionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return `TXN${[...bytes].map((b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('')}`
}

class PaymentDeclined extends MockApiError {
  constructor(message, transaction) {
    super(message, 402)
    this.name = 'PaymentDeclined'
    this.transactionId = transaction
  }
}

/** What the ticket and receipts show for the method used, e.g. "Visa •••• 4242". */
export function describePayment(method, details) {
  if (method === 'card') return `${cardBrand(details.number).label} ${maskCard(details.number)}`
  if (method === 'upi') return details.mode === 'qr' ? 'UPI · QR code' : `UPI · ${details.vpa.trim().toLowerCase()}`
  return WALLETS.find((w) => w.key === details.wallet)?.label ?? 'Wallet'
}

/**
 * Charges `amount` with the chosen method. Resolves to
 * { transactionId, method, label, amount, paidAt } or rejects with a PaymentDeclined.
 */
export const processPayment = ({ method, details, amount }, { signal } = {}) =>
  respond(
    () => {
      const txn = transactionId()
      if (method === 'card' && details.number.replace(/\D/g, '') === TEST_DECLINE.card.replace(/\D/g, '')) {
        throw new PaymentDeclined('Your bank declined this transaction. Try another card or payment method.', txn)
      }
      if (method === 'upi' && details.mode !== 'qr' && details.vpa.trim().toLowerCase() === TEST_DECLINE.upi) {
        throw new PaymentDeclined('The UPI payment request was declined in your UPI app.', txn)
      }
      if (method === 'wallet') {
        const wallet = WALLETS.find((w) => w.key === details.wallet)
        if (!wallet) throw new PaymentDeclined('Choose a wallet to pay with.', txn)
        if (wallet.balance < amount) {
          throw new PaymentDeclined(`Insufficient balance in your ${wallet.label}. Add money or choose another method.`, txn)
        }
      }
      return {
        transactionId: txn,
        method,
        label: describePayment(method, details),
        amount,
        paidAt: new Date().toISOString(),
      }
    },
    signal,
    GATEWAY_LATENCY_MS,
  )
