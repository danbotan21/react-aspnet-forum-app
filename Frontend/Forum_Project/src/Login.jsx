import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Styles/Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: logica de autentificare
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="login-card">
        {/* Secțiune: logare */}
        <section className="login-section">
          <h1 className="login-title">Autentificare</h1>
          <p className="login-subtitle">Introdu datele pentru a accesa contul</p>

          <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">
            Email sau nume de utilizator
          </label>
          <input
            id="email"
            type="text"
            className="login-input"
            placeholder="ex: nume@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <label className="login-label" htmlFor="password">
            Parolă
          </label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Link to="/forgot-password" className="login-forgot">
            Ai uitat parola?
          </Link>

          <button type="submit" className="login-btn">
            Autentificare
          </button>

          <div className="login-divider">sau</div>
          <button type="button" className="login-google-btn" aria-label="Autentificare cu Google">
            <FaGoogle className="login-google-icon" />
          </button>
          </form>
        </section>

        {/* Secțiune: nu ai cont – creează cont */}
        <section className="auth-section auth-section-signup">
          <p className="auth-section-text">Nu ai cont?</p>
          <Link to="/register" className="auth-section-btn">
            Creează cont
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Login;
