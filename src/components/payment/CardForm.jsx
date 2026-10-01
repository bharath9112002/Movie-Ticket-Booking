import TextInput from '../TextInput'
import { cardBrand, formatCardNumber, formatExpiry } from '../../utils/payment'

// Live preview of the card being entered.
function CardPreview({ number, name, expiry, brand }) {
  const placeholder = brand.groups.map((n) => '•'.repeat(n)).join(' ')
  const shown = number ? number + placeholder.slice(number.length) : placeholder
  return (
    <div className={`card-preview is-${brand.key}`} aria-hidden="true">
      <div className="card-preview-top">
        <span className="card-chip" />
        <span className="card-brand">{brand.label}</span>
      </div>
      <p className="card-preview-number">{shown}</p>
      <div className="card-preview-bottom">
        <div>
          <span className="card-preview-label">Card holder</span>
          <span className="card-preview-value">{name.trim() || 'YOUR NAME'}</span>
        </div>
        <div>
          <span className="card-preview-label">Expires</span>
          <span className="card-preview-value">{expiry || 'MM/YY'}</span>
        </div>
      </div>
    </div>
  )
}

export default function CardForm({ value, errors, onChange, disabled }) {
  const brand = cardBrand(value.number)
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value })

  return (
    <div className="card-form">
      <CardPreview number={value.number} name={value.name} expiry={value.expiry} brand={brand} />

      <div className="pay-fields">
        <TextInput
          id="card-number"
          label="Card number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={value.number}
          onChange={(e) => onChange({ ...value, number: formatCardNumber(e.target.value) })}
          error={errors.number}
          disabled={disabled}
          adornment={brand.key !== 'card' && <span className={`brand-badge is-${brand.key}`}>{brand.label}</span>}
        />
        <TextInput
          id="card-name"
          label="Name on card"
          autoComplete="cc-name"
          placeholder="As printed on the card"
          value={value.name}
          onChange={set('name')}
          error={errors.name}
          disabled={disabled}
        />
        <div className="pay-fields-row">
          <TextInput
            id="card-expiry"
            label="Expiry (MM/YY)"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            maxLength={5}
            value={value.expiry}
            onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value, value.expiry) })}
            error={errors.expiry}
            disabled={disabled}
          />
          <TextInput
            id="card-cvv"
            label="CVV"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={'•'.repeat(brand.cvv)}
            maxLength={brand.cvv}
            value={value.cvv}
            onChange={(e) => onChange({ ...value, cvv: e.target.value.replace(/\D/g, '') })}
            error={errors.cvv}
            disabled={disabled}
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.save}
            onChange={(e) => onChange({ ...value, save: e.target.checked })}
            disabled={disabled}
          />
          Save this card for faster checkout
        </label>
      </div>
    </div>
  )
}
