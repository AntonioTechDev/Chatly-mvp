import React from 'react'
import { useWizard } from './WizardContext'
import './Wizard.css'

export const WizardStep4: React.FC = () => {
    const { nextStep, prevStep, data, updateData, isLoading } = useWizard()

    const toggleChannel = (channel: string) => {
        const current = data.acquisitionChannels || []
        const updated = current.includes(channel)
            ? current.filter(c => c !== channel)
            : [...current, channel]
        updateData({ acquisitionChannels: updated })
    }

    const handleContinue = async () => {
        if (!data.customerType || (data.acquisitionChannels || []).length === 0) return
        await nextStep()
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 4 di 7</span>
                <h2 className="step-title">I tuoi clienti</h2>
                <p className="step-description">Come interagisci con il tuo pubblico?</p>
            </div>

            <div className="wizard-form">
                <div className="form-group-auth">
                    <label className="form-label-auth">A chi ti rivolgi?</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button
                            className={`option-card ${data.customerType === 'b2b' ? 'selected' : ''}`}
                            onClick={() => updateData({ customerType: 'b2b' })}
                        >
                            <span className="option-title">B2B</span>
                            <span className="option-desc">Business to Business</span>
                        </button>
                        <button
                            className={`option-card ${data.customerType === 'b2c' ? 'selected' : ''}`}
                            onClick={() => updateData({ customerType: 'b2c' })}
                        >
                            <span className="option-title">B2C</span>
                            <span className="option-desc">Business to Consumer</span>
                        </button>
                    </div>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Quali canali utilizzi oggi?</label>
                    <p className="step-description" style={{ marginBottom: '0.5rem' }}>Seleziona tutti quelli che applichi</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {['WhatsApp', 'Instagram', 'Facebook', 'Sito Web', 'Email', 'Telefono'].map(channel => (
                            <button
                                key={channel}
                                className={`option-pill ${data.acquisitionChannels?.includes(channel) ? 'selected' : ''}`}
                                onClick={() => toggleChannel(channel)}
                            >
                                {channel}
                            </button>
                        ))}
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
                        disabled={!data.customerType || (data.acquisitionChannels || []).length === 0 || isLoading}
                    >
                        {isLoading ? 'Salvataggio...' : 'Continua'}
                    </button>
                </div>
            </div>
            {/* Inline styles for options - verify moves to CSS later */}
            <style>{`
                .option-card {
                    padding: 1rem;
                    border: 2px solid var(--border);
                    border-radius: var(--radius-lg);
                    background: white;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .option-card:hover { border-color: var(--primary); }
                .option-card.selected { border-color: var(--primary); background-color: var(--color-primary-50); }
                .option-title { font-weight: 700; color: var(--color-gray-900); display: block; margin-bottom: 0.25rem;}
                .option-desc { font-size: 0.75rem; color: var(--muted-foreground); }

                .option-pill {
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: white;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .option-pill.selected {
                    background-color: var(--color-gray-900);
                    color: white;
                    border-color: var(--color-gray-900);
                }
            `}</style>
        </div>
    )
}
