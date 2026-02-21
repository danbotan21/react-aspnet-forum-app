import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Styles/Signup.css';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: logica de înregistrare
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-title">Creează cont</h1>
        <p className="signup-subtitle">Completează datele pentru a te înregistra</p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="signup-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className="signup-input"
            placeholder="ex: nume@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="signup-label" htmlFor="signup-username">
            Nume de utilizator
          </label>
          <input
            id="signup-username"
            type="text"
            className="signup-input"
            placeholder="Alege un nume unic"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <label className="signup-label" htmlFor="signup-password">
            Parolă
          </label>
          <input
            id="signup-password"
            type="password"
            className="signup-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label className="signup-label" htmlFor="signup-confirm">
            Confirmă parola
          </label>
          <input
            id="signup-confirm"
            type="password"
            className="signup-input"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button type="submit" className="signup-btn">
            Creează cont
          </button>

          <div className="signup-divider">sau</div>
          <button type="button" className="signup-google-btn" aria-label="Continuă cu Google">
            <FaGoogle className="signup-google-icon" />
          </button>
        </form>

        {/* Secțiune: ai deja cont – logare */}
        <section className="auth-section auth-section-login">
          <p className="auth-section-text">Ai deja cont?</p>
          <Link to="/Login" className="auth-section-btn">
            Autentifică-te
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Signup;
