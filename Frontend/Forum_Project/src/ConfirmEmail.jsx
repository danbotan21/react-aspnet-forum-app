import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Styles/Login.css'

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const ranRef = useRef(false)

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke (token is single-use).
    if (ranRef.current) return
    ranRef.current = true

    if (!token) {
      setStatus('error')
      setMessage('Link invalid: lipsește token-ul de confirmare.')
      return
    }

    const confirm = async () => {
      try {
        const response = await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Emailul a fost confirmat. Te poți autentifica.')
        } else {
          setStatus('error')
          setMessage(
            data.message || 'Linkul de confirmare este invalid sau a expirat.',
          )
        }
      } catch {
        setStatus('error')
        setMessage('Nu s-a putut contacta serverul. Verifică conexiunea.')
      }
    }

    confirm()
  }, [token])

  return (
    <main className='login-page'>
      <div className='auth-simple-wrap'>
        <section className='auth-simple-card'>
          <h2 className='login-title'>Confirmare email</h2>

          {status === 'loading' && (
            <p className='login-subtitle'>Se confirmă contul tău...</p>
          )}

          {status === 'success' && (
            <>
              <div className='login-message login-success'>{message}</div>
              <Link
                to='/login'
                className='login-btn'
                style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginTop: '1rem',
                }}
              >
                Mergi la autentificare
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className='login-message login-error'>{message}</div>
              <Link
                to='/login'
                className='login-forgot'
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1rem',
                }}
              >
                Înapoi la autentificare
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default ConfirmEmail
