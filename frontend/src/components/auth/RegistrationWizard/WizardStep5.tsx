import React from 'react'
import { Button } from '@/components/ui/Button/Button'
import { useWizard } from './WizardContext'

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
        // Single select (Radio behavior)
        updateData({ dataStorage: storage })
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {['CRM (HubSpot, Salesforce...)', 'Google Sheets/Excel', 'Gestionale interno', 'Non ho un sistema'].map(storage => (
                            <button
                                key={storage}
                                className={`check-card ${data.dataStorage === storage ? 'selected' : ''}`}
                                onClick={() => toggleStorage(storage)}
                            >
                                <div className={`radio-circle ${data.dataStorage === storage ? 'checked' : ''}`} />
                                <span className="option-text">{storage}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="wizard-actions">
                    <Button variant="secondary" className="wizard-btn-secondary" onClick={prevStep}>
                        Indietro
                    </Button>
                    <Button
                        variant="primary"
                        className="wizard-btn-primary"
                        style={{ flex: 2, justifyContent: 'center' }}
                        onClick={handleContinue}
                        disabled={(data.usageGoals || []).length === 0}
                        isLoading={isLoading}
                    >
                        Continua
                    </Button>
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
                   text-align: left;
                }
                .check-card:hover { border-color: var(--primary); }
                .check-card.selected { border-color: var(--primary); background-color: var(--color-primary-50); }
                
                .checkbox-circle {
                    width: 1.25rem;
                    height: 1.25rem;
                    flex-shrink: 0;
                    border: 2px solid var(--muted-foreground);
                    border-radius: 4px; /* Square for checkbox */
                    transition: all 0.2s;
                }
                .checkbox-circle.checked {
                    border-color: var(--primary);
                    background-color: var(--primary);
                }

                .radio-circle {
                    width: 1.25rem;
                    height: 1.25rem;
                    flex-shrink: 0;
                    border: 2px solid var(--muted-foreground);
                    border-radius: 50%; /* Round for radio */
                    transition: all 0.2s;
                    position: relative;
                }
                .radio-circle.checked {
                    border-color: var(--primary);
                }
                .radio-circle.checked::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 0.625rem;
                    height: 0.625rem;
                    background-color: var(--primary);
                    border-radius: 50%;
                }

                .option-text { font-weight: 500; color: var(--color-gray-900); }
            `}</style>
        </div>
    )
}
