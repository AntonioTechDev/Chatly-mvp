import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button/Button'
import { useWizard } from './WizardContext'
import { authWizardService } from '@/core/services/authWizardService'
import toast from 'react-hot-toast'

export const WizardStep7: React.FC = () => {
    const { nextStep, prevStep, data, goToDashboard, isLoading } = useWizard()
    const [code, setCode] = useState<string[]>(new Array(8).fill(''))
    const [isVerifying, setIsVerifying] = useState(false)

    // Auto-send SMS on mount
    useEffect(() => {
        const sendSms = async () => {
            if (data.phoneNumber) {
                try {
                    await authWizardService.sendPhoneOtp(data.phoneNumber)
                    toast.success('Codice SMS inviato!')
                } catch (e: any) {
                    console.error(e)
                    toast.error('Errore invio SMS: ' + e.message)
                }
            }
        }
        sendSms()
    }, [data.phoneNumber])

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false
        const newCode = [...code]
        newCode[index] = element.value
        setCode(newCode)
        // Focus next input
        if (element.value !== '' && index < 7) {
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
        if (pin.length !== 8) return

        setIsVerifying(true)
        try {
            await authWizardService.verifyPhoneOtp(data.phoneNumber || '', pin)
            toast.success('Numero verificato!')

            // Finalize wizard on backend
            await authWizardService.completeOnboarding();

            goToDashboard()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Codice non valido')
            setIsVerifying(false)
        }
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
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'nowrap' }}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`sms-${index}`}
                            type="text"
                            maxLength={1}
                            className="form-input-auth"
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                textAlign: 'center',
                                fontSize: '1.25rem',
                                padding: 0
                            }}
                            value={digit}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                <div className="wizard-actions">
                    <Button variant="secondary" className="wizard-btn-secondary" onClick={prevStep}>
                        Indietro
                    </Button>
                    <Button
                        variant="primary"
                        className="wizard-btn-primary"
                        style={{ flex: 2, justifyContent: 'center' }}
                        onClick={handleVerify}
                        disabled={!isComplete || isVerifying}
                        isLoading={isVerifying || isLoading}
                    >
                        Completa registrazione
                    </Button>
                </div>
            </div>
        </div>
    )
}
