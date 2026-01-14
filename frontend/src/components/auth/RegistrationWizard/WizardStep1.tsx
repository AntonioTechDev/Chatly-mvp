import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWizard } from './WizardContext'
import EyeIcon from '@/img/eye-icon.svg?react'
import EyeOffIcon from '@/img/eye-off-icon.svg?react'
import './Wizard.css' // Import CSS

export const WizardStep1: React.FC = () => {
    const { data, updateData, nextStep, isLoading } = useWizard()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    // We keep local state for passwords as they are sensitive and explicitly handled
    // Data.email etc comes from context

    const handleContinue = async () => {
        // Basic validation
        if (!data.email || !password || !confirmPassword || !termsAccepted) return
        if (password !== confirmPassword) {
            alert("Le password non coincidono") // Better: use toast or local error state
            return
        }

        // Here we would create the user in Supabase in a real flow
        // For now we simulate or call a create user function
        // Then call nextStep()
        await nextStep()
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 1 di 7</span>
                <h2 className="step-title">Crea il tuo account Chatly</h2>
                <p className="step-description">Prova gratuita di 14 giorni, senza carta di credito</p>
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
                        {/* Check icon if valid logic here */}
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
                    {/* Password strength meter would go here */}
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
                        className="terms-checkbox" // Style this
                        style={{ width: 'auto' }}
                    />
                    <label className="step-description" style={{ margin: 0 }}>
                        Accetto i <button className="register-link" style={{ marginLeft: 0 }}>Termini di servizio</button> e la <button className="register-link" style={{ marginLeft: 0 }}>Privacy Policy</button>
                    </label>
                </div>

                <button
                    className="wizard-btn-primary"
                    onClick={handleContinue}
                    disabled={!termsAccepted || !data.email || !password || isLoading}
                >
                    {isLoading ? 'Attendi...' : 'Continua'}
                    {/* Arrow Icon */}
                </button>
            </div>

            <div className="wizard-footer">
                Hai già un account? <Link to="/login" className="register-link">Accedi</Link>
            </div>
        </div>
    )
}
