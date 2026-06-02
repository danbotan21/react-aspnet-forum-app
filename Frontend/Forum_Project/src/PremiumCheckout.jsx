import { useMemo, useState } from 'react'
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaRegCreditCard } from 'react-icons/fa'
import './Styles/PremiumCheckout.css'

const onlyDigits = (s) => (s || '').replace(/\D/g, '')

const formatCardNumber = (s) =>
  onlyDigits(s)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()

const formatExpiry = (s) => {
  const d = onlyDigits(s).slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

const detectBrand = (s) => {
  const d = onlyDigits(s)
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  return 'card'
}

const BrandMark = ({ brand }) => {
  if (brand === 'visa') return <FaCcVisa className='pc-brand-icon' />
  if (brand === 'mastercard') return <FaCcMastercard className='pc-brand-icon' />
  if (brand === 'amex') return <FaCcAmex className='pc-brand-icon' />
  return <FaRegCreditCard className='pc-brand-icon' />
}

// Self-contained checkout: an interactive flip card + the input fields.
// On submit it calls onPay(card) — the parent owns the API call and result handling.
export const PremiumCheckout = ({ price = '4.99', isPaying = false, onPay, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('')
  const [nameOnCard, setNameOnCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [flipped, setFlipped] = useState(false)

  const brand = useMemo(() => detectBrand(cardNumber), [cardNumber])
  const maxCvc = brand === 'amex' ? 4 : 3

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isPaying) return
    onPay({ cardNumber, nameOnCard, expiry, cvc })
  }

  return (
    <div className='pc'>
      {/* ===== Visual card ===== */}
      <div className={`pc-card-scene ${flipped ? 'is-flipped' : ''}`}>
        <div className='pc-card'>
          {/* Front */}
          <div className={`pc-card-face pc-card-front pc-brand-${brand}`}>
            <div className='pc-card-top'>
              <div className='pc-chip' aria-hidden />
              <BrandMark brand={brand} />
            </div>
            <div className='pc-card-number'>
              {formatCardNumber(cardNumber) || '•••• •••• •••• ••••'}
            </div>
            <div className='pc-card-bottom'>
              <div className='pc-card-field'>
                <span className='pc-card-caption'>Card Holder</span>
                <span className='pc-card-data'>
                  {nameOnCard.trim() ? nameOnCard.toUpperCase() : 'YOUR NAME'}
                </span>
              </div>
              <div className='pc-card-field pc-card-field--exp'>
                <span className='pc-card-caption'>Expires</span>
                <span className='pc-card-data'>{expiry || 'MM/YY'}</span>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className={`pc-card-face pc-card-back pc-brand-${brand}`}>
            <div className='pc-card-stripe' />
            <div className='pc-card-sign'>
              <div className='pc-card-sign-bar' />
              <div className='pc-card-cvc'>{cvc || '•••'}</div>
            </div>
            <div className='pc-card-cvc-caption'>CVC</div>
          </div>
        </div>
      </div>

      {/* ===== Fields ===== */}
      <form className='pc-form' onSubmit={handleSubmit}>
        <div className='pc-field'>
          <label className='pc-label'>Card number</label>
          <input
            className='pc-input'
            inputMode='numeric'
            autoComplete='cc-number'
            placeholder='4242 4242 4242 4242'
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value)}
            onFocus={() => setFlipped(false)}
            disabled={isPaying}
          />
        </div>

        <div className='pc-field'>
          <label className='pc-label'>Name on card</label>
          <input
            className='pc-input'
            autoComplete='cc-name'
            placeholder='John Doe'
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            onFocus={() => setFlipped(false)}
            disabled={isPaying}
          />
        </div>

        <div className='pc-row'>
          <div className='pc-field'>
            <label className='pc-label'>Expiry</label>
            <input
              className='pc-input'
              inputMode='numeric'
              autoComplete='cc-exp'
              placeholder='MM/YY'
              value={formatExpiry(expiry)}
              onChange={(e) => setExpiry(e.target.value)}
              onFocus={() => setFlipped(false)}
              disabled={isPaying}
            />
          </div>
          <div className='pc-field'>
            <label className='pc-label'>CVC</label>
            <input
              className='pc-input'
              inputMode='numeric'
              autoComplete='cc-csc'
              placeholder='123'
              value={cvc}
              onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, maxCvc))}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              disabled={isPaying}
            />
          </div>
        </div>

        <div className='pc-actions'>
          <button type='submit' className='pc-pay-btn' disabled={isPaying}>
            {isPaying ? 'Processing…' : `Pay $${price}`}
          </button>
          <button
            type='button'
            className='pc-cancel-btn'
            onClick={onCancel}
            disabled={isPaying}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
