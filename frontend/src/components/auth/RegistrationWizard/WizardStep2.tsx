import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button/Button'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWizard } from './WizardContext'
import { authWizardService } from '@/core/services/authWizardService'
import { supabase } from '@/core/lib/supabase'
import toast from 'react-hot-toast'

export const WizardStep2: React.FC = () => {
    const { data, updateData } = useWizard()
    const navigate = useNavigate()
    const location = useLocation()
    const emailFromStep1 = (location.state as any)?.email || data.email
    const [code, setCode] = useState<string[]>(new Array(8).fill(''))
    const [timeLeft, setTimeLeft] = useState(30)
    const [isVerifying, setIsVerifying] = useState(false)
    const hasAutoSentRef = useRef(false)

    // Auto-send OTP on mount (only once)
    useEffect(() => {
        if (hasAutoSentRef.current || !emailFromStep1) return

        const autoSendOtp = async () => {
            try {
                hasAutoSentRef.current = true
                await authWizardService.sendEmailOtp(emailFromStep1)
                // Silent auto-send - don't toast to avoid distraction
                setTimeLeft(30)
            } catch (error: any) {
                console.error('Auto-send OTP failed:', error)
                // Don't toast on auto-send failure - let user click "Resend"
            }
        }

        autoSendOtp()
    }, [emailFromStep1])

    // Focus first input on mount
    useEffect(() => {
        const firstInput = document.getElementById('pin-0')
        if (firstInput) firstInput.focus()
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
        if (element.value !== '' && index < 7) {
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
        if (pin.length !== 8) return

        setIsVerifying(true)
        try {
            const result = await authWizardService.verifyEmailOtp(emailFromStep1, pin)

            // Email verified successfully - DO NOT show long success toast
            // Immediately redirect to Step 3
            if (result.user) {
                // Update wizard data with verified email
                updateData({
                    email: emailFromStep1,
                    userId: result.user.id,
                    emailVerified: true
                })

                // Silent redirect to Step 3
                navigate('/onboarding/step-3', {
                    replace: true,
                    state: {
                        userId: result.user.id,
                        email: emailFromStep1
                    }
                })
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Codice non valido')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResend = async () => {
        if (timeLeft > 0) return
        try {
            await authWizardService.sendEmailOtp(emailFromStep1)
            toast.success('Codice inviato! Controlla la tua email.')
            setTimeLeft(30)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Errore durante l\'invio')
        }
    }

    const isComplete = code.every(digit => digit !== '')

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <span className="step-indicator">Passaggio 2 di 7</span>
                <h2 className="step-title">Controlla la tua email</h2>
                <p className="step-description">
                    Abbiamo inviato un codice di conferma a <strong>{emailFromStep1}</strong>
                </p>
                <button
                    className="register-link"
                    style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
                    onClick={() => navigate('/onboarding/step-1', { replace: true })}
                >
                    Cambia email
                </button>
            </div>

            <div className="wizard-form">
                <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'nowrap' }}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`pin-${index}`}
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

                <Button
                    variant="primary"
                    className="wizard-btn-primary"
                    onClick={handleVerify}
                    disabled={!isComplete || isVerifying}
                    isLoading={isVerifying}
                    style={{ justifyContent: 'center' }}
                >
                    Verifica email
                </Button>
            </div>
        </div>
    )
}
