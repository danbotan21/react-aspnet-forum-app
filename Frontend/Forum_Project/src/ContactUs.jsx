import { useState } from 'react'
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaClock } from 'react-icons/fa'
import './Styles/ContactUs.css'

const INITIAL_FORM = {
  fullName: '',
  email: '',
  subject: '',
  topic: 'general',
  message: '',
}

const TOPICS = [
  { value: 'general', label: 'Intrebare generala' },
  { value: 'account', label: 'Cont si autentificare' },
  { value: 'community', label: 'Comunitati si moderare' },
  { value: 'bug', label: 'Raporteaza o problema' },
  { value: 'legal', label: 'Intrebare legala' },
]

// Maps the form topic to the backend ContactType enum (int).
const TOPIC_TO_TYPE = {
  general: 0,
  account: 1,
  community: 2,
  bug: 3,
  legal: 4,
}

export const ContactUs = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [isSent, setIsSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMsg('')
    setIsSent(false)

    // Client-side checks mirror the backend validation.
    if (formData.fullName.trim().length < 2) {
      setErrorMsg('Numele trebuie sa aiba cel putin 2 caractere.')
      return
    }
    if (formData.message.trim().length < 10) {
      setErrorMsg('Mesajul trebuie sa aiba cel putin 10 caractere.')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          type: TOPIC_TO_TYPE[formData.topic] ?? 0,
          message: formData.message.trim(),
        }),
      })

      if (!res.ok) {
        let msg = 'Mesajul nu a putut fi trimis. Incearca din nou.'
        try {
          const data = await res.json()
          msg = data?.message || data?.Message || msg
        } catch {
          /* keep default message */
        }
        throw new Error(msg)
      }

      setIsSent(true)
      setFormData(INITIAL_FORM)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className='app-main contact-page'>
      <div className='contact-shell'>
        <section className='contact-hero'>
          <p className='contact-kicker'>CONTACT US</p>
          <p className='contact-subtitle'>
            Spune-ne ce ai nevoie si revenim cu un raspuns clar, rapid si util.
            Iti raspundem in mod normal in mai putin de 24 de ore.
          </p>
        </section>

        <section className='contact-grid'>
          <article className='contact-card contact-card--form'>
            <h2 className='contact-section-title'>Trimite un mesaj</h2>
            <p className='contact-section-desc'>
              Completeaza formularul, iar echipa noastra te va contacta pe
              email.
            </p>

            <form className='contact-form' onSubmit={handleSubmit}>
              <div className='contact-row'>
                <label className='contact-field'>
                  <span>Nume complet</span>
                  <input
                    type='text'
                    name='fullName'
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder='Ex: Andrei Popescu'
                    required
                  />
                </label>

                <label className='contact-field'>
                  <span>Email</span>
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='Ex: andrei@email.com'
                    required
                  />
                </label>
              </div>

              <label className='contact-field'>
                <span>Subiect</span>
                <input
                  type='text'
                  name='subject'
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder='Ex: Nu pot accesa comunitatea'
                  required
                />
              </label>

              <label className='contact-field'>
                <span>Tip solicitare</span>
                <select
                  name='topic'
                  value={formData.topic}
                  onChange={handleChange}
                >
                  {TOPICS.map((topic) => (
                    <option key={topic.value} value={topic.value}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className='contact-field'>
                <span>Mesaj</span>
                <textarea
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  placeholder='Descrie problema sau intrebarea ta in cateva detalii.'
                  rows={6}
                  required
                />
              </label>

              <button
                type='submit'
                className='contact-submit-btn'
                disabled={isSending}
              >
                {isSending ? 'Se trimite...' : 'Trimite mesajul'}
              </button>

              {isSent && (
                <p className='contact-success' role='status'>
                  Mesajul a fost trimis. Revenim catre tine cat mai curand.
                </p>
              )}

              {errorMsg && (
                <p className='contact-error' role='alert'>
                  {errorMsg}
                </p>
              )}
            </form>
          </article>

          <aside className='contact-card contact-card--info'>
            <h2 className='contact-section-title'>Date de contact</h2>
            <p className='contact-section-desc'>
              Poti folosi si metodele de mai jos daca preferi contact direct.
            </p>

            <ul className='contact-info-list'>
              <li>
                <FaEnvelope className='contact-info-icon' />
                <div>
                  <p className='contact-info-label'>Email suport</p>
                  <p className='contact-info-value'>support@credit-forum.com</p>
                </div>
              </li>
              <li>
                <FaPhoneAlt className='contact-info-icon' />
                <div>
                  <p className='contact-info-label'>Telefon</p>
                  <p className='contact-info-value'>+067326966</p>
                </div>
              </li>
              <li>
                <FaMapMarkerAlt className='contact-info-icon' />
                <div>
                  <p className='contact-info-label'>Adresa</p>
                  <p className='contact-info-value'>
                    Strada Studenților 7, MD-2012, Chișinău
                  </p>
                </div>
              </li>
              <li>
                <FaClock className='contact-info-icon' />
                <div>
                  <p className='contact-info-label'>Program suport</p>
                  <p className='contact-info-value'>
                    Luni - Vineri, 09:00 - 18:00
                  </p>
                </div>
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  )
}
