import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button/Button'
import toast from 'react-hot-toast'
import EyeIcon from '@/img/eye-icon.svg?react'
import EyeOffIcon from '@/img/eye-off-icon.svg?react'
import './LoginPage.css'

const UpdatePasswordPage: React.FC = () => {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || password.length < 8) {
            toast.error('La password deve essere di almeno 8 caratteri')
            return
        }

        setIsSubmitting(true)
        try {
            await authService.updateUserPassword(password)
            toast.success('Password aggiornata con successo!')
            navigate('/dashboard')
        } catch (error: any) {
            console.error('Update password error:', error)
            toast.error(error.message || 'Errore durante l\'aggiornamento della password')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="login-page">
            <AuthLayout title="Nuova Password">
                <div className="login-form-container">
                    <p className="step-description" style={{ marginBottom: '1.5rem' }}>
                        Scegli una nuova password per il tuo account.
                    </p>

                    <form onSubmit={handleSubmit} className="login-fields">
                        <div className="form-group-auth">
                            <label htmlFor="password" className="form-label-auth">Nuova Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="form-input-auth"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <div className="icon-size-5">
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="submit-btn"
                            isLoading={isSubmitting}
                            style={{ justifyContent: 'center' }}
                        >
                            Aggiorna Password
                        </Button>
                    </form>
                </div>
            </AuthLayout>
        </div>
    )
}

export default UpdatePasswordPage
