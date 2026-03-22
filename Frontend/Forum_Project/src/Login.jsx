import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaGoogle, FaShieldAlt, FaUsers, FaBolt } from 'react-icons/fa'
import './Styles/Login.css'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: logica de autentificare
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

            <button type='submit' className='login-btn'>
              Autentificare
            </button>

            <div className='login-divider'>sau continua cu</div>
            <button
              type='button'
              className='login-google-btn'
              aria-label='Autentificare cu Google'
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
