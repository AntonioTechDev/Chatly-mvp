import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Card } from '@/components/ui/Card/Card'
import { Button } from '@/components/ui/Button/Button'
import { Input } from '@/components/ui/Input/Input'
import { Toaster, toast } from 'react-hot-toast'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ArrowLeft } from 'lucide-react'
import './LoginPage.css' // Reuse styles

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsSubmitting(true)
        try {
            await authService.resetPasswordForEmail(email)
            setIsSent(true)
            toast.success('Email di recupero inviata!')
        } catch (error: any) {
            console.error('Reset password error:', error)
            toast.error(error.message || 'Errore durante l\'invio della richiesta')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSent) {
        return (
            <div className="login-page">
                <AuthLayout title="Controlla la tua email">
                    <div className="login-form-container text-center">
                        <p className="step-description" style={{ marginBottom: '1.5rem' }}>
                            Abbiamo inviato un link per reimpostare la password a <strong>{email}</strong>
                        </p>
                        <Link to="/login">
                            <Button variant="secondary" className="w-full">
                                Torna al login
                            </Button>
                        </Link>
                    </div>
                </AuthLayout>
            </div>
        )
    }

    return (
        <div className="login-page">
            <AuthLayout title="Recupera Password">
                <div className="login-form-container">
                    <p className="step-description" style={{ marginBottom: '1.5rem' }}>
                        Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.
                    </p>

                    <form onSubmit={handleSubmit} className="login-fields">
                        <div className="form-group-auth">
                            <label htmlFor="email" className="form-label-auth">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input-auth"
                                placeholder="mario@azienda.it"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="submit-btn"
                            isLoading={isSubmitting}
                            disabled={!email}
                            style={{ justifyContent: 'center' }}
                        >
                            Invia istruzioni
                        </Button>
                    </form>

                    <div className="register-prompt" style={{ marginTop: '1.5rem' }}>
                        <Link to="/login" className="register-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={16} /> Torna al login
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        </div>
    )
}

export default ForgotPasswordPage
