import React, { useState, useEffect } from 'react'
import { useWizard } from './WizardContext'
import toast from 'react-hot-toast'
import './Wizard.css' // Import CSS

export const WizardStep2: React.FC = () => {
    const { nextStep, prevStep, data, isLoading } = useWizard()
    const [code, setCode] = useState<string[]>(new Array(6).fill(''))
    const [timeLeft, setTimeLeft] = useState(30) // 30 seconds countdown for resend
    const [isVerifying, setIsVerifying] = useState(false)

    // Focus first input on mount
    useEffect(() => {
        const firstInput = document.getElementById('pin-0')
        if (firstInput) firstInput.focus()
    }, [])

    // Timer for code resend
    // Timer for code resend
    useEffect(() => {
        // MOCK: Show code in toast for testing
        // In production this would be handled by backend
        const timer = setTimeout(() => {
            toast('Il tuo codice di verifica è: 123456', {
                icon: '📧',
                duration: 6000
            })
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [timeLeft])

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false

        const newCode = [...code]
        newCode[index] = element.value
        setCode(newCode)

        // Focus next input
        if (element.value !== '' && index < 5) {
            const nextInput = document.getElementById(`pin-${index + 1}`)
            if (nextInput) nextInput.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const newCode = [...code]
            if (code[index] === '' && index > 0) {
                // If empty, move back and delete previous
                newCode[index - 1] = ''
                const prevInput = document.getElementById(`pin-${index - 1}`)
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

        // MOCK Validation
        if (pin !== '123456') {
            toast.error('Codice non valido')
            return
        }

        setIsVerifying(true)
        // Simulate API call
        setTimeout(async () => {
            setIsVerifying(false)
            await nextStep()
        }, 1500)
    }

    const handleResend = () => {
        if (timeLeft > 0) return
        // Resend logic here
        setTimeLeft(30)
        // toast.success('Codice inviato!')
    }

    const isComplete = code.every(digit => digit !== '')

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 2 di 7</span>
                <h2 className="step-title">Controlla la tua email</h2>
                <p className="step-description">
                    Abbiamo inviato un codice di conferma a <strong>{data.email}</strong>
                </p>
                <button className="register-link" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }} onClick={prevStep}>
                    Cambia email
                </button>
            </div>

            <div className="wizard-form">
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`pin-${index}`}
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

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p className="step-description">
                        Non hai ricevuto il codice? <br />
                        <button
                            className="register-link"
                            onClick={handleResend}
                            disabled={timeLeft > 0}
                            style={{ opacity: timeLeft > 0 ? 0.5 : 1, cursor: timeLeft > 0 ? 'default' : 'pointer' }}
                        >
                            Invia di nuovo {timeLeft > 0 && `(${timeLeft}s)`}
                        </button>
                    </p>
                </div>

                <button
                    className="wizard-btn-primary"
                    onClick={handleVerify}
                    disabled={!isComplete || isVerifying || isLoading}
                >
                    {isVerifying || isLoading ? 'Verifica in corso...' : 'Verifica email'}
                </button>
            </div>
        </div>
    )
}
