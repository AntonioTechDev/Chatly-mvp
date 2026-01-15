import React from 'react'
import { Button } from '@/components/ui/Button/Button'
import { useWizard } from './WizardContext'

export const WizardStep3: React.FC = () => {
    const { nextStep, prevStep, data, updateData, isLoading } = useWizard()

    const handleContinue = async () => {
        if (!data.companyName || !data.industry || !data.employeeCount) return
        await nextStep()
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 3 di 7</span>
                <h2 className="step-title">Parlaci della tua azienda</h2>
                <p className="step-description">Personalizzeremo l'esperienza in base alle tue esigenze</p>
            </div>

            <div className="wizard-form">
                <div className="form-group-auth">
                    <label className="form-label-auth">Nome Azienda</label>
                    <input
                        type="text"
                        className="form-input-auth"
                        placeholder="Es. Chatly S.r.l."
                        value={data.companyName || ''}
                        onChange={(e) => updateData({ companyName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Sito Web (Opzionale)</label>
                    <input
                        type="url"
                        className="form-input-auth"
                        placeholder="https://www.chatly.it"
                        value={data.website || ''}
                        onChange={(e) => updateData({ website: e.target.value })}
                    />
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Settore</label>
                    <select
                        className="form-input-auth"
                        value={data.industry || ''}
                        onChange={(e) => updateData({ industry: e.target.value })}
                        required
                    >
                        <option value="" disabled>Seleziona un settore</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="saas">SaaS / Tech</option>
                        <option value="agency">Agenzia Marketing</option>
                        <option value="retail">Retail / Negozio Fisico</option>
                        <option value="healthcare">Salute e Benessere</option>
                        <option value="education">Istruzione / Formazione</option>
                        <option value="finance">Finanza / Assicurazioni</option>
                        <option value="realestate">Immobiliare</option>
                        <option value="hospitality">Ristorazione / Turismo</option>
                        <option value="other">Altro</option>
                    </select>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Numero di dipendenti</label>
                    <select
                        className="form-input-auth"
                        value={data.employeeCount || ''}
                        onChange={(e) => updateData({ employeeCount: e.target.value })}
                        required
                    >
                        <option value="" disabled>Seleziona dimensione</option>
                        <option value="1-10">1-10 (Startup / Micro)</option>
                        <option value="11-50">11-50 (Piccola Impresa)</option>
                        <option value="51-200">51-200 (Media Impresa)</option>
                        <option value="201-500">201-500</option>
                        <option value="500+">500+ (Enterprise)</option>
                    </select>
                </div>

                <div className="wizard-actions">
                    <Button
                        variant="primary"
                        className="wizard-btn-primary"
                        style={{ flex: 2, justifyContent: 'center' }}
                        onClick={handleContinue}
                        disabled={!data.companyName || !data.industry || !data.employeeCount}
                        isLoading={isLoading}
                    >
                        Continua
                    </Button>
                </div>
            </div>
        </div>
    )
}
