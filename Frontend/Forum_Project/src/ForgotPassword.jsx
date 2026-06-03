import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Styles/Login.css'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Introdu adresa de email.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      // The endpoint always responds neutrally (never reveals if the email exists),
      // so on any 2xx we show the same confirmation message.
      if (response.ok) {
        setSent(true)
      } else {
        setError('A apărut o eroare. Încearcă din nou.')
      }
    } catch {
      setError('Nu s-a putut contacta serverul. Verifică conexiunea.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='login-page'>
      <div className='auth-simple-wrap'>
        <section className='auth-simple-card'>
          <h2 className='login-title'>Ai uitat parola?</h2>
          <p className='login-subtitle'>
            Introdu emailul contului tău și îți trimitem un link pentru a-ți
            seta o parolă nouă.
          </p>

          {sent ? (
            <>
              <div className='login-message login-success'>
                Dacă există un cont cu acest email, ți-am trimis un link de
                resetare. Verifică-ți inbox-ul (și folderul Spam).
              </div>
              <p className='login-subtitle' style={{ marginTop: '1rem' }}>
                Link-ul expiră în 30 de minute și poate fi folosit o singură
                dată.
              </p>
              <Link
                to='/login'
                className='login-btn'
                style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginTop: '0.5rem',
                }}
              >
                Înapoi la autentificare
              </Link>
            </>
          ) : (
            <form className='login-form' onSubmit={handleSubmit}>
              <label className='login-label' htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                className='login-input'
                placeholder='ex: nume@email.com'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete='email'
              />

              {error && (
                <div className='login-message login-error'>{error}</div>
              )}

              <button type='submit' className='login-btn' disabled={loading}>
                {loading ? 'Se trimite...' : 'Trimite link-ul de resetare'}
              </button>

              <Link
                to='/login'
                className='login-forgot'
                style={{ textAlign: 'center', marginTop: '0.4rem' }}
              >
                Înapoi la autentificare
              </Link>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword
