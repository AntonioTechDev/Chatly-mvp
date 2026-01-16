import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button/Button'
import { apiClient } from '@/api/api-client'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Toaster, toast } from 'react-hot-toast'

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1 data
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Step 2 data
    const [otp, setOtp] = useState('')

    // Step 3 data
    const [companyName, setCompanyName] = useState('')
    const [industry, setIndustry] = useState('')
    const [employeeCount, setEmployeeCount] = useState('')

    // Step 4 data
    const [customerType, setCustomerType] = useState('')
    const [channels, setChannels] = useState<string[]>([])

    // Step 5 data
    const [goals, setGoals] = useState<string[]>([])
    const [dataStorage, setDataStorage] = useState('')

    // Step 6 data
    const [role, setRole] = useState('')
    const [phone, setPhone] = useState('')

    // Step 7 data
    const [smsCode, setSmsCode] = useState('')

    // Check if user is logged in and has progress
    useEffect(() => {
        const checkProgress = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                try {
                    const progress = await apiClient<any>('/onboarding/status')
                    if (progress.currentStep) {
                        setStep(progress.currentStep)
                    }
                } catch (e) {
                    console.error('Error checking progress:', e)
                }
            }
        }
        checkProgress()
    }, [])

    const handleStep1 = async () => {
        if (!email || !password || password !== confirmPassword) {
            toast.error('Compila tutti i campi correttamente')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-1', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            })
            setStep(2)
        } catch (error: any) {
            toast.error(error.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    const handleStep2 = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Inserisci il codice a 6 cifre')
            return
        }

        setLoading(true)
        try {
            const result = await apiClient<any>('/onboarding/step-2/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            })

            // Set session
            if (result.accessToken && result.refreshToken) {
                await supabase.auth.setSession({
                    access_token: result.accessToken,
                    refresh_token: result.refreshToken
                })
            }

            setStep(3)
        } catch (error: any) {
            toast.error(error.message || 'Codice non valido')
        } finally {
            setLoading(false)
        }
    }

    const handleStep3 = async () => {
        if (!companyName || !industry || !employeeCount) {
            toast.error('Compila tutti i campi')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-3', {
                method: 'POST',
                body: JSON.stringify({ companyName, website: '', industry, employeeCount })
            })
            setStep(4)
        } catch (error: any) {
            toast.error(error.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    const handleStep4 = async () => {
        if (!customerType || channels.length === 0) {
            toast.error('Compila tutti i campi')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-4', {
                method: 'POST',
                body: JSON.stringify({ customerType, acquisitionChannels: channels })
            })
            setStep(5)
        } catch (error: any) {
            toast.error(error.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    const handleStep5 = async () => {
        if (goals.length === 0) {
            toast.error('Seleziona almeno un obiettivo')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-5', {
                method: 'POST',
                body: JSON.stringify({ usageGoals: goals, dataStorage })
            })
            setStep(6)
        } catch (error: any) {
            toast.error(error.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    const handleStep6 = async () => {
        if (!role || !phone) {
            toast.error('Compila tutti i campi')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-6', {
                method: 'POST',
                body: JSON.stringify({ role, phoneNumber: phone })
            })
            setStep(7)

            // Auto-send SMS
            await apiClient('/onboarding/step-7/send-sms', { method: 'POST' })
            toast.success('SMS inviato!')
        } catch (error: any) {
            toast.error(error.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    const handleStep7 = async () => {
        if (!smsCode || smsCode.length !== 6) {
            toast.error('Inserisci il codice a 6 cifre')
            return
        }

        setLoading(true)
        try {
            await apiClient('/onboarding/step-7/verify-sms', {
                method: 'POST',
                body: JSON.stringify({ code: smsCode })
            })

            await apiClient('/onboarding/complete', { method: 'POST' })

            toast.success('Registrazione completata!')
            navigate('/dashboard')
        } catch (error: any) {
            toast.error(error.message || 'Codice non valido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
                <h2>Registrazione - Step {step}/7</h2>

                {step === 1 && (
                    <div>
                        <h3>Email e Password</h3>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <input
                            type="password"
                            placeholder="Conferma Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <Button onClick={handleStep1} isLoading={loading}>Continua</Button>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3>Verifica Email</h3>
                        <p>Codice inviato a: {email}</p>
                        <input
                            type="text"
                            placeholder="Codice OTP (6 cifre)"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                            maxLength={6}
                        />
                        <Button onClick={handleStep2} isLoading={loading}>Verifica</Button>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3>Azienda</h3>
                        <input
                            type="text"
                            placeholder="Nome Azienda"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">Seleziona Settore</option>
                            <option value="ecommerce">E-commerce</option>
                            <option value="saas">SaaS</option>
                            <option value="other">Altro</option>
                        </select>
                        <select
                            value={employeeCount}
                            onChange={(e) => setEmployeeCount(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">Dipendenti</option>
                            <option value="1-10">1-10</option>
                            <option value="11-50">11-50</option>
                            <option value="51-200">51-200</option>
                        </select>
                        <Button onClick={handleStep3} isLoading={loading}>Continua</Button>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <h3>Clienti</h3>
                        <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">Tipo Cliente</option>
                            <option value="b2b">B2B</option>
                            <option value="b2c">B2C</option>
                        </select>
                        <div>
                            {['WhatsApp', 'Email', 'Telefono'].map(ch => (
                                <label key={ch} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={channels.includes(ch)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setChannels([...channels, ch])
                                            } else {
                                                setChannels(channels.filter(c => c !== ch))
                                            }
                                        }}
                                    />
                                    {' '}{ch}
                                </label>
                            ))}
                        </div>
                        <Button onClick={handleStep4} isLoading={loading} style={{ marginTop: '1rem' }}>Continua</Button>
                    </div>
                )}

                {step === 5 && (
                    <div>
                        <h3>Obiettivi</h3>
                        {['Automatizzare supporto', 'Generare lead', 'Gestire appuntamenti'].map(g => (
                            <label key={g} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={goals.includes(g)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setGoals([...goals, g])
                                        } else {
                                            setGoals(goals.filter(gg => gg !== g))
                                        }
                                    }}
                                />
                                {' '}{g}
                            </label>
                        ))}
                        <select
                            value={dataStorage}
                            onChange={(e) => setDataStorage(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }}
                        >
                            <option value="">Dove salvi i dati?</option>
                            <option value="CRM">CRM</option>
                            <option value="Excel">Excel</option>
                            <option value="None">Nessun sistema</option>
                        </select>
                        <Button onClick={handleStep5} isLoading={loading}>Continua</Button>
                    </div>
                )}

                {step === 6 && (
                    <div>
                        <h3>Profilo</h3>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        >
                            <option value="">Ruolo</option>
                            <option value="founder">Founder</option>
                            <option value="manager">Manager</option>
                            <option value="other">Altro</option>
                        </select>
                        <input
                            type="tel"
                            placeholder="Telefono (+39...)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                        />
                        <Button onClick={handleStep6} isLoading={loading}>Continua</Button>
                    </div>
                )}

                {step === 7 && (
                    <div>
                        <h3>Verifica Telefono</h3>
                        <p>SMS inviato a: {phone}</p>
                        <input
                            type="text"
                            placeholder="Codice SMS (6 cifre)"
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value)}
                            className="form-input-auth"
                            style={{ width: '100%', marginBottom: '1rem' }}
                            maxLength={6}
                        />
                        <Button onClick={handleStep7} isLoading={loading}>Completa</Button>
                    </div>
                )}
            </div>
        </AuthLayout>
    )
}
