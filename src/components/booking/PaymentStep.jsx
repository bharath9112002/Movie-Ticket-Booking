import { useEffect, useRef, useState } from 'react'
import CheckoutGuard from './CheckoutGuard'
import CardForm from '../payment/CardForm'
import OrderSummary from '../payment/OrderSummary'
import PaymentMethods from '../payment/PaymentMethods'
import { PaymentFailure, PaymentSuccess } from '../payment/PaymentResult'
import UpiForm from '../payment/UpiForm'
import WalletForm from '../payment/WalletForm'
import { useAuth } from '../../context/AuthContext'
import { createBooking } from '../../services/bookingApi'
import { describePayment, processPayment } from '../../services/paymentApi'
import { requestIdFor, urlForStep } from '../../utils/bookingFlow'
import { formatCurrency } from '../../utils/format'
import {
  PAYMENT_METHODS,
  TEST_DECLINE,
  WALLETS,
  isQrExpired,
  methodPanelId,
  methodTabId,
  validateCard,
  validateUpiId,
} from '../../utils/payment'

const PAYEE = 'CineBook'

// Field ids to focus when validation fails, in on-screen order.
const FIELD_IDS = { number: 'card-number', name: 'card-name', expiry: 'card-expiry', cvv: 'card-cvv', vpa: 'upi-id' }

function validate(method, forms) {
  if (method === 'card') return validateCard(forms.card)
  if (method === 'upi') {
    if (forms.upi.mode === 'qr') return {}
    const vpa = validateUpiId(forms.upi.vpa)
    return vpa ? { vpa } : {}
  }
  return forms.wallet ? {} : { wallet: 'Choose a wallet to pay with' }
}

function detailsFor(method, forms) {
  if (method === 'wallet') return { wallet: forms.wallet }
  return forms[method]
}

function processingCopy(method, forms) {
  if (method === 'card') return ['Verifying with your bank…', 'Hold on while your bank authorises the payment.']
  if (method === 'upi' && forms.upi.mode === 'qr') return ['Checking payment status…', 'Confirming the payment you made by scanning the QR code.']
  if (method === 'upi') return ['Waiting for you to approve…', `Open your UPI app and approve the request sent to ${forms.upi.vpa}.`]
  const wallet = WALLETS.find((w) => w.key === forms.wallet)
  return [`Paying with ${wallet.label}…`, 'Debiting the amount from your wallet balance.']
}

function TestModeHint() {
  return (
    <details className="pay-test">
      <summary>Test mode: no real payment is made</summary>
      <ul>
        <li>
          Any valid card succeeds (e.g. <code>4111 1111 1111 1111</code>, any future expiry, any CVV). Use{' '}
          <code>{TEST_DECLINE.card}</code> to simulate a decline.
        </li>
        <li>
          Any UPI ID succeeds. Use <code>{TEST_DECLINE.upi}</code> to simulate a declined request.
        </li>
        <li>Wallets fail if their balance is less than the amount payable.</li>
      </ul>
    </details>
  )
}

export default function PaymentStep({ state }) {
  const { user } = useAuth()
  const [method, setMethod] = useState('card')
  const [forms, setForms] = useState(() => ({
    card: { number: '', name: user.name, expiry: '', cvv: '', save: false },
    upi: { mode: 'id', vpa: '', app: '', qrExpiresAt: 0 },
    wallet: '',
  }))
  // Errors show after the first attempt with a method, then update as the user types.
  const [attempted, setAttempted] = useState({})
  const [phase, setPhase] = useState({ status: 'form' }) // form | processing | success | failure
  const [notice, setNotice] = useState('')
  const controller = useRef(null)
  const inFlight = useRef(false)

  useEffect(() => () => controller.current?.abort(), [])

  const errors = attempted[method] ? validate(method, forms) : {}
  const setForm = (key) => (value) => setForms((f) => ({ ...f, [key]: value }))

  const pay = async (amount) => {
    if (inFlight.current) return
    setNotice('')
    setAttempted((a) => ({ ...a, [method]: true }))
    const found = validate(method, forms)
    const first = Object.keys(found)[0]
    if (first) {
      requestAnimationFrame(() => {
        const el = first === 'wallet' ? document.querySelector('input[name="wallet"]') : document.getElementById(FIELD_IDS[first])
        el?.focus()
      })
      return
    }
    if (method === 'upi' && forms.upi.mode === 'qr' && isQrExpired(forms.upi.qrExpiresAt)) {
      setNotice('This QR code has expired. Refresh it and scan again.')
      return
    }

    inFlight.current = true
    const details = detailsFor(method, forms)
    const ctrl = new AbortController()
    controller.current = ctrl
    setPhase({ status: 'processing', stage: 'paying', copy: processingCopy(method, forms) })

    let receipt = null
    try {
      receipt = await processPayment({ method, details, amount }, { signal: ctrl.signal })
      setPhase({ status: 'processing', stage: 'confirming', copy: ['Confirming your seats…', 'Payment received. Issuing your tickets.'] })
      const { booking } = await createBooking({
        user,
        showId: state.show,
        seatIds: state.seats,
        requestId: requestIdFor(state.show, state.seats),
        payment: receipt,
      })
      setPhase({ status: 'success', booking, receipt })
    } catch (err) {
      if (err.name === 'AbortError') {
        setPhase({ status: 'form' })
        setNotice('Payment cancelled. You have not been charged.')
      } else {
        setPhase({
          status: 'failure',
          reason: err.message,
          amount,
          label: describePayment(method, details),
          transactionId: err.transactionId ?? receipt?.transactionId,
          charged: Boolean(receipt),
          seatsTaken: err.status === 409,
        })
      }
    } finally {
      inFlight.current = false
    }
  }

  if (phase.status === 'success') return <PaymentSuccess booking={phase.booking} receipt={phase.receipt} />
  if (phase.status === 'failure') {
    return (
      <PaymentFailure
        failure={phase}
        onRetry={() => setPhase({ status: 'form' })}
        onChangeMethod={() => {
          setMethod(PAYMENT_METHODS.find((m) => m.key !== method).key)
          setPhase({ status: 'form' })
        }}
        summaryUrl={urlForStep(state, 'summary')}
        seatsUrl={urlForStep(state, 'seats')}
      />
    )
  }

  const processing = phase.status === 'processing'

  return (
    <CheckoutGuard state={state}>
      {(checkout) => {
        const amount = checkout.price.total
        const payLabel = method === 'upi' && forms.upi.mode === 'qr' ? "I've paid" : `Pay ${formatCurrency(amount)}`
        return (
          <div className="pay-layout">
            <section className="pay-panel" aria-labelledby="step-title">
              <h2 id="step-title" className="summary-heading">Choose a payment method</h2>

              <div className="pay-body">
                <PaymentMethods value={method} onChange={setMethod} disabled={processing} />

                <form
                  className="pay-form"
                  role="tabpanel"
                  id={methodPanelId(method)}
                  aria-labelledby={methodTabId(method)}
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    pay(amount)
                  }}
                >
                  {processing ? (
                    <div className="pay-processing" role="status" aria-live="polite">
                      <span className="spinner" aria-hidden="true" />
                      <h3>{phase.copy[0]}</h3>
                      <p>{phase.copy[1]}</p>
                      <p className="muted">Please don&rsquo;t refresh or close this page.</p>
                      {phase.stage === 'paying' && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => controller.current?.abort()}>
                          Cancel payment
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {method === 'card' && <CardForm value={forms.card} errors={errors} onChange={setForm('card')} />}
                      {method === 'upi' && (
                        <UpiForm value={forms.upi} errors={errors} onChange={setForm('upi')} amount={amount} payee={PAYEE} />
                      )}
                      {method === 'wallet' && (
                        <WalletForm value={forms.wallet} error={errors.wallet} onChange={setForm('wallet')} amount={amount} />
                      )}

                      {notice && (
                        <p className="summary-note" role="status">
                          {notice}
                        </p>
                      )}

                      <button type="submit" className="btn btn-primary btn-block pay-submit">
                        🔒 {payLabel}
                      </button>
                      <p className="pay-secure">Payments are encrypted and processed securely. We never store your card number or CVV.</p>
                    </>
                  )}
                </form>
              </div>

              {!processing && <TestModeHint />}
            </section>

            <OrderSummary checkout={checkout} editUrl={urlForStep(state, 'summary')} />
          </div>
        )
      }}
    </CheckoutGuard>
  )
}
