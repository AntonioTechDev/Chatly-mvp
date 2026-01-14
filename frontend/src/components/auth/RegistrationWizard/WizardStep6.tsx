import React from 'react'
import { useWizard } from './WizardContext'
import './Wizard.css'

export const WizardStep6: React.FC = () => {
    const { nextStep, prevStep, data, updateData, isLoading } = useWizard()

    const handleContinue = async () => {
        if (!data.role || !data.phoneNumber) return
        await nextStep()
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 6 di 7</span>
                <h2 className="step-title">Il tuo profilo</h2>
                <p className="step-description">Chi sei in azienda?</p>
            </div>

            <div className="wizard-form">
                <div className="form-group-auth">
                    <label className="form-label-auth">Qual è il tuo ruolo?</label>
                    <select
                        className="form-input-auth"
                        value={data.role || ''}
                        onChange={(e) => updateData({ role: e.target.value })}
                        required
                    >
                        <option value="" disabled>Seleziona ruolo</option>
                        <option value="founder">Founder / CEO</option>
                        <option value="manager">Marketing / Sales Manager</option>
                        <option value="developer">Developer / CTO</option>
                        <option value="support">Customer Support Lead</option>
                        <option value="agency_owner">Agency Owner</option>
                        <option value="freelancer">Freelancer</option>
                        <option value="other">Altro</option>
                    </select>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Numero di telefono</label>
                    <p className="step-description" style={{ marginBottom: '0.5rem' }}>Necessario per attivare l'account e le notifiche di sicurezza.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select className="form-input-auth" style={{ width: '6rem' }}>
                            <option value="+39">+39 🇮🇹</option>
                            {/* Add more later */}
                        </select>
                        <input
                            type="tel"
                            className="form-input-auth"
                            placeholder="333 1234567"
                            value={data.phoneNumber || ''}
                            onChange={(e) => updateData({ phoneNumber: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="wizard-actions">
                    <button className="wizard-btn-secondary" onClick={prevStep}>
                        Indietro
                    </button>
                    <button
                        className="wizard-btn-primary"
                        style={{ flex: 2 }}
                        onClick={handleContinue}
                        disabled={!data.role || !data.phoneNumber || isLoading}
                    >
                        {isLoading ? 'Invio codice...' : 'Continua'}
                    </button>
                </div>
            </div>
        </div>
    )
}
