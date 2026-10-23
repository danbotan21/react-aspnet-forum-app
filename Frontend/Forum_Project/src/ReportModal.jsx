import { useState } from 'react'
import { FaTimes, FaFlag, FaCheck } from 'react-icons/fa'
import { submitReport } from './utils/reportApi'
import './Styles/ReportModal.css'

const REPORT_REASONS = [
  'Spam',
  'Hate speech / Personal attack',
  'Misinformation / Fake news',
  'Illegal content',
  'Unsolicited promotion / Spam links',
  'Sexual or violent content',
  'Other',
]

export function ReportModal({ type, reportedItemId, label, onClose, token }) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const finalReason = reason === 'Other' ? customReason.trim() : reason

  const handleSubmit = async () => {
    if (!finalReason) { setError('Please select or enter a reason.'); return }
    if (!token) { setError('You must be logged in to report.'); return }
    setSubmitting(true)
    setError(null)
    try {
      await submitReport({ type, reportedItemId, reason: finalReason, token })
      setDone(true)
      setTimeout(onClose, 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='report-modal-overlay' onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className='report-modal'>
        <div className='report-modal-header'>
          <div className='report-modal-title-row'>
            <FaFlag className='report-modal-icon' />
            <h2 className='report-modal-title'>Report {label}</h2>
          </div>
          <button className='report-modal-close' onClick={onClose} aria-label='Close'>
            <FaTimes />
          </button>
        </div>

        {done ? (
          <div className='report-modal-success'>
            <FaCheck className='report-success-icon' />
            <p>Thank you! Your report has been submitted.</p>
          </div>
        ) : (
          <div className='report-modal-body'>
            <p className='report-modal-desc'>
              Help us understand the problem. What's wrong with this content?
            </p>

            <div className='report-reasons'>
              {REPORT_REASONS.map((r) => (
                <label key={r} className={`report-reason-item ${reason === r ? 'report-reason-active' : ''}`}>
                  <input
                    type='radio'
                    name='reason'
                    value={r}
                    checked={reason === r}
                    onChange={() => { setReason(r); setError(null) }}
                    className='report-reason-radio'
                  />
                  {r}
                </label>
              ))}
            </div>

            {reason === 'Other' && (
              <textarea
                className='report-custom-reason'
                placeholder='Please describe the issue...'
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                maxLength={200}
              />
            )}

            {error && <p className='report-modal-error'>{error}</p>}

            <div className='report-modal-actions'>
              <button className='report-cancel-btn' onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                className='report-submit-btn'
                onClick={handleSubmit}
                disabled={submitting || !finalReason}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
