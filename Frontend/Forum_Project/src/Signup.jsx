import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaStar, FaCheckCircle, FaLock } from 'react-icons/fa'
import './Styles/Signup.css'

export const Signup = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    // Validare pe frontend
    if (password !== confirmPassword) {
      setError('Parolele nu coincid.')
      return
    }

    if (password.length < 6) {
      setError('Parola trebuie sa aiba minim 6 caractere.')
      return
    }

    if (username.length < 6) {
      setError('Numele de utilizator trebuie sa aiba minim 6 caractere.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: username,
          email: email,
          password: password,
        }),
      })

      if (response.status === 201) {
        setSuccess('Cont creat cu succes! Vei fi redirectionat...')
        // Redirect catre Login dupa 1.5 secunde
        setTimeout(() => navigate('/login'), 1500)
      } else if (response.status === 400) {
        const data = await response.json()
        setError(data.message || 'Email-ul sau username-ul este deja folosit.')
      } else {
        setError('A aparut o eroare neasteptata. Incearca din nou.')
      }
    } catch (err) {
      setError('Nu s-a putut contacta serverul. Verifica conexiunea.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='signup-page'>
      <div className='signup-shell'>
        <section className='signup-showcase'>
          <p className='signup-showcase-kicker'>GET STARTED</p>
          <h1>Creeaza-ti un cont nou</h1>
          <p className='signup-showcase-text'>
            Intra in conversatii relevante, descopera comunitati active si
            publica usor continut de calitate.
          </p>
          <ul className='signup-showcase-list'>
            <li>
              <FaStar />
              Onboarding rapid in mai putin de 1 minut
            </li>
            <li>
              <FaCheckCircle />
              Control complet asupra profilului
            </li>
            <li>
              <FaLock />
              Setari de securitate si confidentialitate
            </li>
          </ul>
        </section>

        <section className='signup-card'>
          <h2 className='signup-title'>Creeaza cont</h2>
          <p className='signup-subtitle'>
            Completeaza campurile pentru a te inregistra.
          </p>

          <form className='signup-form' onSubmit={handleSubmit}>
            <label className='signup-label' htmlFor='signup-email'>
              Email
            </label>
            <input
              id='signup-email'
              type='email'
              className='signup-input'
              placeholder='ex: nume@email.com'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete='email'
            />

            <label className='signup-label' htmlFor='signup-username'>
              Nume de utilizator
            </label>
            <input
              id='signup-username'
              type='text'
              className='signup-input'
              placeholder='Alege un nume unic'
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete='username'
            />

            <label className='signup-label' htmlFor='signup-password'>
              Parola
            </label>
            <input
              id='signup-password'
              type='password'
              className='signup-input'
              placeholder='••••••••'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete='new-password'
            />

            <label className='signup-label' htmlFor='signup-confirm'>
              Confirma parola
            </label>
            <input
              id='signup-confirm'
              type='password'
              className='signup-input'
              placeholder='••••••••'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete='new-password'
            />

            {error && <div className='signup-message signup-error'>{error}</div>}
            {success && <div className='signup-message signup-success'>{success}</div>}

            <button type='submit' className='signup-btn' disabled={loading}>
              {loading ? 'Se creeaza contul...' : 'Creeaza cont'}
            </button>

            <div className='signup-divider'>sau continua cu</div>
            <button
              type='button'
              className='signup-google-btn'
              aria-label='Continua cu Google'
            >
              <FaGoogle className='signup-google-icon' />
              Google
            </button>
          </form>

          <section className='auth-section auth-section-login'>
            <p className='auth-section-text'>Ai deja cont?</p>
            <Link to='/Login' className='auth-section-btn'>
              Autentifica-te
            </Link>
          </section>
        </section>
      </div>
    </main>
  )
}

export default Signup