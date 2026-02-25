import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaGoogle,FaStar, FaCheckCircle, FaLock } from 'react-icons/fa'
import './Styles/Signup.css'

export const Signup = () => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: logica de inregistrare
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

            <button type='submit' className='signup-btn'>
              Creeaza cont
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