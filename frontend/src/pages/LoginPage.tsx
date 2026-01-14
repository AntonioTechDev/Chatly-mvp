import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/core/contexts/AuthContext'
import { AuthLayout } from '@/components/auth/AuthLayout'
import SpinnerIcon from '@/img/spinner.svg?react'
import GoogleIcon from '@/img/google-icon.svg?react'
import EyeIcon from '@/img/eye-icon.svg?react'
import EyeOffIcon from '@/img/eye-off-icon.svg?react'

import './LoginPage.css'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = 'Email richiesta'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email non valida'
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password richiesta'
    } else if (password.length < 8) {
      newErrors.password = 'La password deve contenere almeno 8 caratteri'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      // Error is handled in AuthContext
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    // Placeholder for Google Auth
    console.log('Google login clicked')
  }

  return (
    <div className="login-page">
      <AuthLayout
        title="Accedi a Chatly"
      >
        <div className="login-form-container">
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <div className="icon-size-5">
              <GoogleIcon />
            </div>
            <span>Accedi con Google</span>
          </button>

          <div className="auth-separator">
            <div className="separator-line" />
            <span className="separator-text">oppure</span>
            <div className="separator-line" />
          </div>

          <form onSubmit={handleSubmit} className="login-fields">
            <div className="form-group-auth">
              <label htmlFor="email" className="form-label-auth">Email</label>
              <input
                type="email"
                id="email"
                className="form-input-auth"
                placeholder="mario@azienda.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group-auth">
              <label htmlFor="password" className="form-label-auth">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-input-auth"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  <div className="icon-size-5">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </div>
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <button type="button" className="forgot-password-link">
              Password dimenticata?
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <div className="register-prompt">
            Non hai un account?
            <Link to="/register" className="register-link">Registrati</Link>
            <span className="register-subtext">e inizia la prova gratuita di 14 giorni</span>
          </div>
        </div>
      </AuthLayout>
    </div>
  )
}

export default LoginPage
