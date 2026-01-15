import React, { useState } from 'react'
import { Button } from '@/components/ui/Button/Button'
import { Link, useNavigate } from 'react-router-dom'
import { useWizard } from './WizardContext'
import { authWizardService } from '@/core/services/authWizardService'
import toast from 'react-hot-toast'
import GoogleIcon from '@/img/google-icon.svg?react'
import EyeIcon from '@/img/eye-icon.svg?react'
import EyeOffIcon from '@/img/eye-off-icon.svg?react'
import { authService } from '@/core/services/authService'

export const WizardStep1: React.FC = () => {
    const { data, updateData, isLoading } = useWizard()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleContinue = async () => {
        if (!data.email || !password || !confirmPassword || !termsAccepted) return
        if (password !== confirmPassword) {
            toast.error("Le password non coincidono")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await authWizardService.signUp(data.email, password)

            // Account successfully created - DO NOT show success message
            // Immediately redirect to Step 2 for email verification
            if (result.user?.id) {
                navigate('/onboarding/step-2', {
                    replace: true,
                    state: {
                        email: data.email,
                        userId: result.user.id
                    }
                })
            }
        } catch (error: any) {
            console.error(error)
            // Supabase API returns 400 or 422 for existing user
            // Message usually contains "User already registered" or similar
            if (error.message?.includes('registered') || error.status === 400 || error.status === 422) {
                toast.error("Utente già registrato. Prova ad accedere.", { duration: 5000 })
            } else {
                toast.error(error.message || "Errore durante la registrazione")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            await authService.signInWithGoogle()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 1 di 7</span>
                <h2 className="step-title">Crea il tuo account Chatly</h2>
                <p className="step-description">Prova gratuita di 14 giorni, senza carta di credito</p>

                <Button
                    variant="secondary"
                    className="google-btn"
                    onClick={handleGoogleLogin}
                    style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                >
                    <div className="icon-size-5"><GoogleIcon /></div>
                    <span>Registrati con Google</span>
                </Button>

                <div className="auth-separator" style={{ margin: '1.5rem 0' }}>
                    <div className="separator-line" />
                    <span className="separator-text">oppure</span>
                    <div className="separator-line" />
                </div>
            </div>

            <div className="wizard-form">
                <div className="form-group-auth">
                    <label className="form-label-auth">Email aziendale</label>
                    <div className="input-wrapper">
                        <input
                            type="email"
                            className="form-input-auth"
                            placeholder="mario@azienda.it"
                            value={data.email || ''}
                            onChange={(e) => updateData({ email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Password</label>
                    <div className="input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
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
                        >
                            <div className="icon-size-5">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</div>
                        </button>
                    </div>
                    <p className="register-subtext" style={{ fontSize: '0.7rem' }}>Minimo 8 caratteri, 1 maiuscola, 1 numero.</p>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Conferma password</label>
                    <input
                        type="password"
                        className="form-input-auth"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group-auth" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="terms-checkbox"
                        style={{ width: 'auto' }}
                    />
                    <label className="step-description" style={{ margin: 0 }}>
                        Accetto i <button className="register-link" style={{ marginLeft: 0 }}>Termini di servizio</button> e la <button className="register-link" style={{ marginLeft: 0 }}>Privacy Policy</button>
                    </label>
                </div>

                <Button
                    variant="primary"
                    className="wizard-btn-primary"
                    onClick={handleContinue}
                    disabled={!termsAccepted || !data.email || !password}
                    isLoading={isSubmitting}
                    style={{ justifyContent: 'center' }}
                >
                    Continua
                </Button>
            </div>

            <div className="wizard-footer">
                Hai già un account? <Link to="/login" className="register-link">Accedi</Link>
            </div>
        </div>
    )
}
