import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaShieldAlt, FaUsers, FaBolt } from 'react-icons/fa'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from './AuthContext'
import './Styles/Login.css'

export const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Two-step login: after the password is accepted, a code is emailed and we
  // switch to the code-entry step.
  const [step, setStep] = useState('credentials') // 'credentials' | 'code'
  const [code, setCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setError('')
      setLoading(true)
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        })

        if (res.ok) {
          const data = await res.json()
          login(data.token, data.user)
          navigate('/home')
        } else {
          setError('Autentificarea cu Google a esuat. Incearca din nou.')
        }
      } catch {
        setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Autentificarea cu Google a esuat.'),
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')
    setNeedsConfirmation(false)

    if (!email || !password) {
      setError('Completeaza ambele campuri.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.requiresCode) {
        // Password OK → move to the code step.
        setPendingEmail(data.email || email)
        setStep('code')
        setInfo('Ți-am trimis un cod de autentificare pe email. Verifică inbox-ul.')
      } else if (response.ok && data.token) {
        login(data.token, data.user)
        navigate('/home')
      } else if (response.status === 403 && data.requiresEmailConfirmation) {
        setNeedsConfirmation(true)
        setPendingEmail(data.email || email)
        setError(
          'Contul nu este confirmat. Verifică emailul pentru linkul de confirmare.',
        )
      } else if (response.status === 401) {
        setError('Email sau parola incorecta.')
      } else {
        setError(data.message || 'A aparut o eroare. Incearca din nou.')
      }
    } catch (err) {
      setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()
    setError('')

    if (!code.trim()) {
      setError('Introdu codul primit pe email.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: code.trim() }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.token) {
        login(data.token, data.user)
        navigate('/home')
      } else if (response.status === 401) {
        setError('Cod invalid sau expirat. Încearcă din nou.')
      } else {
        setError(data.message || 'A aparut o eroare. Incearca din nou.')
      }
    } catch (err) {
      setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setError('')
    setInfo('')
    try {
      await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail || email }),
      })
      setInfo('Dacă există un cont neconfirmat, ți-am trimis un nou link de confirmare.')
      setNeedsConfirmation(false)
    } catch {
      setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
    }
  }

  const backToCredentials = () => {
    setStep('credentials')
    setCode('')
    setError('')
    setInfo('')
  }

  return (
    <main className='login-page'>
      <div className='login-shell'>
        <section className='login-showcase'>
          <p className='login-showcase-kicker'>WELCOME BACK</p>
          <h1>Intra in comunitatea ta preferata</h1>
          <p className='login-showcase-text'>
            Acceseaza rapid discutiile, postarile si notificarile intr-o
            experienta moderna si organizata.
          </p>
          <ul className='login-showcase-list'>
            <li>
              <FaShieldAlt />
              Securitate si control pe cont
            </li>
            <li>
              <FaUsers />
              Comunitati active si moderare clara
            </li>
            <li>
              <FaBolt />
              Navigare rapida si flux intuitiv
            </li>
          </ul>
        </section>

        <section className='login-card'>
          <h2 className='login-title'>Autentificare</h2>
          <p className='login-subtitle'>
            Introdu datele pentru a accesa contul tau.
          </p>

          {step === 'code' ? (
            <form className='login-form' onSubmit={handleVerifyCode}>
              <label className='login-label' htmlFor='login-code'>
                Cod de autentificare
              </label>
              <input
                id='login-code'
                type='text'
                inputMode='numeric'
                maxLength={6}
                className='login-input'
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ''))
                }
                autoComplete='one-time-code'
                autoFocus
                style={{ letterSpacing: '0.3em', textAlign: 'center' }}
              />

              {info && <div className='login-message login-success'>{info}</div>}
              {error && <div className='login-message login-error'>{error}</div>}

              <button type='submit' className='login-btn' disabled={loading}>
                {loading ? 'Se verifica...' : 'Confirmă codul'}
              </button>

              <button
                type='button'
                className='login-forgot'
                onClick={backToCredentials}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ← Înapoi
              </button>
            </form>
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

              <label className='login-label' htmlFor='password'>
                Parola
              </label>
              <input
                id='password'
                type='password'
                className='login-input'
                placeholder='••••••••'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete='current-password'
              />

              <Link to='/forgot-password' className='login-forgot'>
                Ai uitat parola?
              </Link>

              {info && <div className='login-message login-success'>{info}</div>}
              {error && (
                <div className='login-message login-error'>{error}</div>
              )}

              {needsConfirmation && (
                <button
                  type='button'
                  className='login-forgot'
                  onClick={handleResendConfirmation}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Retrimite emailul de confirmare
                </button>
              )}

              <button type='submit' className='login-btn' disabled={loading}>
                {loading ? 'Se autentifica...' : 'Autentificare'}
              </button>

              <div className='login-divider'>sau continua cu</div>
              <button
                type='button'
                className='login-google-btn'
                aria-label='Autentificare cu Google'
                onClick={() => handleGoogleLogin()}
                disabled={loading}
              >
                <FaGoogle className='login-google-icon' />
                Google
              </button>
            </form>
          )}

          <section className='auth-section auth-section-signup'>
            <p className='auth-section-text'>Nu ai cont?</p>
            <Link to='/register' className='auth-section-btn'>
              Creeaza cont
            </Link>
          </section>
        </section>
      </div>
    </main>
  )
}

export default Login
