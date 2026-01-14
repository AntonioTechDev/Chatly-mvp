import React, { useState, useEffect } from 'react'
import { useWizard } from './WizardContext'
import toast from 'react-hot-toast'
import './Wizard.css'

export const WizardStep7: React.FC = () => {
    const { nextStep, prevStep, data, goToDashboard, isLoading } = useWizard()
    const [code, setCode] = useState<string[]>(new Array(6).fill(''))
    const [isVerifying, setIsVerifying] = useState(false)

    // MOCK: Show SMS code
    useEffect(() => {
        const timer = setTimeout(() => {
            // In production this would come from an SMS provider
            toast('Il tuo codice SMS è: 987654', {
                icon: '📱',
                duration: 6000
            })
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false
        const newCode = [...code]
        newCode[index] = element.value
        setCode(newCode)
        if (element.value !== '' && index < 5) {
            const nextInput = document.getElementById(`sms-${index + 1}`)
            if (nextInput) nextInput.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const newCode = [...code]
            if (code[index] === '' && index > 0) {
                newCode[index - 1] = ''
                const prevInput = document.getElementById(`sms-${index - 1}`)
                if (prevInput) prevInput.focus()
            } else {
                newCode[index] = ''
            }
            setCode(newCode)
        }
    }

    const handleVerify = async () => {
        const pin = code.join('')
        if (pin.length !== 6) return

        if (pin !== '987654') {
            toast.error('Codice non valido')
            return
        }

        setIsVerifying(true)
        // Simulate verification and final submission
        setTimeout(async () => {
            setIsVerifying(false)
            // Finalize wizard
            goToDashboard()
        }, 1500)
    }

    const isComplete = code.every(digit => digit !== '')

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 7 di 7</span>
                <h2 className="step-title">Verifica numero</h2>
                <p className="step-description">
                    Abbiamo inviato un SMS al numero <strong>{data.phoneNumber}</strong>
                </p>
                <button className="register-link" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }} onClick={prevStep}>
                    Modifica numero
                </button>
            </div>

            <div className="wizard-form">
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`sms-${index}`}
                            type="text"
                            maxLength={1}
                            className="form-input-auth"
                            style={{
                                width: '3rem',
                                height: '3rem',
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                padding: 0
                            }}
                            value={digit}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                <div className="wizard-actions">
                    <button className="wizard-btn-secondary" onClick={prevStep}>
                        Indietro
                    </button>
                    <button
                        className="wizard-btn-primary"
                        style={{ flex: 2 }}
                        onClick={handleVerify}
                        disabled={!isComplete || isVerifying || isLoading}
                    >
                        {isVerifying ? 'Verifica...' : 'Completa registrazione'}
                    </button>
                </div>
            </div>
        </div>
    )
}
