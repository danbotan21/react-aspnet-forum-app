import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Styles/Login.css'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Link invalid. Cere un nou email de resetare.')
      return
    }
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.')
      return
    }
    if (password !== confirm) {
      setError('Parolele nu coincid.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
          confirmPassword: confirm,
        }),
      })

      if (response.ok) {
        setDone(true)
        setTimeout(() => navigate('/login', { replace: true }), 2500)
      } else {
        let message = 'Link-ul de resetare este invalid sau a expirat.'
        try {
          const data = await response.json()
          if (data?.message) message = data.message
        } catch {
          /* keep default */
        }
        setError(message)
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
          <h2 className='login-title'>Setează o parolă nouă</h2>
          <p className='login-subtitle'>
            Alege o parolă nouă pentru contul tău.
          </p>

          {done ? (
            <>
              <div className='login-message login-success'>
                Parola a fost resetată cu succes. Te redirecționăm către
                autentificare...
              </div>
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
          ) : !token ? (
            <>
              <div className='login-message login-error'>
                Link invalid sau lipsește token-ul. Cere din nou un email de
                resetare.
              </div>
              <Link
                to='/forgot-password'
                className='login-btn'
                style={{
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginTop: '1rem',
                }}
              >
                Cere un link nou
              </Link>
            </>
          ) : (
            <form className='login-form' onSubmit={handleSubmit}>
              <label className='login-label' htmlFor='new-password'>
                Parolă nouă
              </label>
              <input
                id='new-password'
                type='password'
                className='login-input'
                placeholder='••••••••'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete='new-password'
              />

              <label className='login-label' htmlFor='confirm-password'>
                Confirmă parola
              </label>
              <input
                id='confirm-password'
                type='password'
                className='login-input'
                placeholder='••••••••'
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete='new-password'
              />

              {error && (
                <div className='login-message login-error'>{error}</div>
              )}

              <button type='submit' className='login-btn' disabled={loading}>
                {loading ? 'Se salvează...' : 'Schimbă parola'}
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

export default ResetPassword
