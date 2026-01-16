import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card/Card'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { authService } from '@/services/authService'
import { AuthLayout } from '@/components/auth/AuthLayout'
import GoogleIcon from '@/img/google-icon.svg?react'
import EyeIcon from '@/img/eye-icon.svg?react'
import EyeOffIcon from '@/img/eye-off-icon.svg?react'

import './LoginPage.css'

// Debug helpers
const logDebug = (action: string, data?: any) => {
  console.log(`[LoginPage] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  })
}

const logError = (action: string, error: any) => {
  console.error(`[LoginPage] ❌ ${action}:`, {
    timestamp: new Date().toISOString(),
    error: error?.message || error,
    stack: error?.stack
  })
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validateForm = (): boolean => {
    logDebug('VALIDATING form', { email, hasPassword: !!password })

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
    const isValid = Object.keys(newErrors).length === 0

    logDebug('VALIDATION result', {
      isValid,
      errors: newErrors
    })

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    logDebug('FORM SUBMITTED')

    if (!validateForm()) {
      logDebug('FORM VALIDATION failed, aborting submit')
      return
    }

    logDebug('FORM VALIDATION passed, starting login')
    setIsSubmitting(true)

    try {
      logDebug('CALLING login function', { email })
      await login(email, password)

      logDebug('LOGIN SUCCESS, navigating to dashboard')
      navigate('/dashboard')
    } catch (error) {
      // Error is handled in AuthContext
      logError('LOGIN FAILED', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    logDebug('GOOGLE LOGIN clicked')

    try {
      await authService.signInWithGoogle()
      logDebug('GOOGLE LOGIN initiated (redirect should occur)')
    } catch (error) {
      logError('GOOGLE LOGIN FAILED', error)
    }
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

            <Link to="/forgot-password" className="forgot-password-link" style={{ display: 'inline-block', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'right', width: '100%', textDecoration: 'none' }}>
              Password dimenticata?
            </Link>

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
