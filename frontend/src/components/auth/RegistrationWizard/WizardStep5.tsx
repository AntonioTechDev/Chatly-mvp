import React from 'react'
import { useWizard } from './WizardContext'
import './Wizard.css'

export const WizardStep5: React.FC = () => {
    const { nextStep, prevStep, data, updateData, isLoading } = useWizard()

    const toggleGoal = (goal: string) => {
        const current = data.usageGoals || []
        const updated = current.includes(goal)
            ? current.filter(g => g !== goal)
            : [...current, goal]
        updateData({ usageGoals: updated })
    }

    const toggleStorage = (storage: string) => {
        const current = data.dataStorage || []
        const updated = current.includes(storage)
            ? current.filter(s => s !== storage)
            : [...current, storage]
        updateData({ dataStorage: updated })
    }

    const handleContinue = async () => {
        if ((data.usageGoals || []).length === 0) return
        await nextStep()
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 5 di 7</span>
                <h2 className="step-title">Obiettivi e Dati</h2>
                <p className="step-description">Cosa vuoi ottenere con Chatly?</p>
            </div>

            <div className="wizard-form">
                <div className="form-group-auth">
                    <label className="form-label-auth">Quali sono i tuoi obiettivi principali?</label>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {[
                            'Automatizzare il supporto clienti',
                            'Generare più lead',
                            'Qualificare i contatti',
                            'Gestire appuntamenti',
                            'Inviare broadcast/newsletter'
                        ].map(goal => (
                            <button
                                key={goal}
                                className={`check-card ${data.usageGoals?.includes(goal) ? 'selected' : ''}`}
                                onClick={() => toggleGoal(goal)}
                            >
                                <div className={`checkbox-circle ${data.usageGoals?.includes(goal) ? 'checked' : ''}`} />
                                <span className="option-text">{goal}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group-auth">
                    <label className="form-label-auth">Dove salvi i dati dei clienti?</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['CRM (HubSpot, Salesforce...)', 'Google Sheets/Excel', 'Gestionale interno', 'Non ho un sistema'].map(storage => (
                            <button
                                key={storage}
                                className={`option-pill ${data.dataStorage?.includes(storage) ? 'selected' : ''}`}
                                onClick={() => toggleStorage(storage)}
                            >
                                {storage}
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
                        disabled={(data.usageGoals || []).length === 0 || isLoading}
                    >
                        {isLoading ? 'Salvataggio...' : 'Continua'}
                    </button>
                </div>
            </div>
            <style>{`
                .check-card {
                   padding: 1rem;
                   border: 1px solid var(--border);
                   border-radius: var(--radius-lg);
                   background: white;
                   display: flex;
                   align-items: center;
                   gap: 0.75rem;
                   cursor: pointer;
                   transition: all 0.2s;
                   width: 100%;
                }
                .check-card:hover { border-color: var(--primary); }
                .check-card.selected { border-color: var(--primary); background-color: var(--color-primary-50); }
                
                .checkbox-circle {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid var(--muted-foreground);
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                .checkbox-circle.checked {
                    border-color: var(--primary);
                    background-color: var(--primary);
                }
                .option-text { font-weight: 500; color: var(--color-gray-900); }
            `}</style>
        </div>
    )
}
