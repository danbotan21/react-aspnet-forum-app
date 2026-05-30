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
  const [loading, setLoading] = useState(false)

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

      if (response.ok) {
        const data = await response.json()
        login(data.token, data.user)
        // Redirect la home
        navigate('/home')
      } else if (response.status === 401) {
        setError('Email sau parola incorecta.')
      } else {
        setError('A aparut o eroare. Incearca din nou.')
      }
    } catch (err) {
      setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
    } finally {
      setLoading(false)
    }
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

          <form className='login-form' onSubmit={handleSubmit}>
            <label className='login-label' htmlFor='email'>
              Email sau nume de utilizator
            </label>
            <input
              id='email'
              type='text'
              className='login-input'
              placeholder='ex: nume@email.com'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete='username'
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

            {/* <Link to='/forgot-password' className='login-forgot'>
              Ai uitat parola?
            </Link> */}
            <Link className='login-forgot'>Ai uitat parola?</Link>

            {error && <div className='login-message login-error'>{error}</div>}

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
