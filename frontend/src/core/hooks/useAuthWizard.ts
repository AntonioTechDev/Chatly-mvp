import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type WizardData, INITIAL_WIZARD_DATA } from '../types/auth-wizard.types'
import { authWizardService } from '../services/authWizardService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useAuthWizard = () => {
    // URL param source of truth
    const { step } = useParams<{ step: string }>()
    const urlStep = step ? parseInt(step.replace('step-', '')) : null

    const [currentStep, setCurrentStep] = useState(urlStep || 1)
    const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useAuth()
    const navigate = useNavigate()

    // Sync state with URL
    useEffect(() => {
        if (urlStep && urlStep !== currentStep) {
            setCurrentStep(urlStep)
        }
    }, [urlStep])

    // Initialize Wizard State
    useEffect(() => {
        const init = async () => {
            try {
                // If user is authenticated (logged in), validate wizard step
                if (user) {
                    // Fetch progress from backend
                    const progress = await authWizardService.getWizardProgress(user.id)

                    if (progress) {
                        if (progress.data) {
                            setData(prev => ({ ...prev, ...progress.data }))
                        }

                        const remoteStep = progress.currentStep || 1

                        // For authenticated users, ensure minimum step is 3
                        // (Steps 1-2 are for unauthenticated signup flow)
                        const targetStep = Math.max(remoteStep, 3)

                        if (!urlStep || urlStep < targetStep) {
                            // Redirect to correct step
                            navigate(`/onboarding/step-${targetStep}`, { replace: true })
                        }
                    } else {
                        // Fallback - no progress found, start at step 3
                        if (!urlStep) navigate(`/onboarding/step-3`, { replace: true })
                    }
                } else {
                    // Unauthenticated user - allow steps 1-2
                    // If no URL step provided, default to step 1
                    if (!urlStep) {
                        navigate(`/onboarding/step-1`, { replace: true })
                    }
                }
            } catch (e) {
                console.error('Wizard init error', e)
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [user, urlStep, navigate])

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }, [])

    const nextStep = useCallback(async () => {
        setIsLoading(true)
        try {
            if (user) {
                // Save progress for CURRENT step completion
                // The new step will be current + 1
                const nextStepNum = currentStep + 1;
                await authWizardService.saveStepData(user.id, currentStep, data)

                // Navigate to next URL
                navigate(`/onboarding/step-${nextStepNum}`)
            } else {
                // Unauthenticated flow (Step 1 -> 2)
                // Just URL change? No, for unauthenticated we might need internal state if routes are protected?
                // Actually routes are public or protected.
                // If unauthenticated, we rely on URL too.
                navigate(`/onboarding/step-${currentStep + 1}`)
            }
        } catch (error) {
            console.error('Failed to save wizard progress', error)
            toast.error('Errore durante il salvataggio dei dati')
        } finally {
            setIsLoading(false)
        }
    }, [user, data, currentStep, navigate])

    const prevStep = useCallback(() => {
        // Minimum step: 1 for unauthenticated, 3 for authenticated
        const minStep = user ? 3 : 1
        const prev = Math.max(minStep, currentStep - 1)
        navigate(`/onboarding/step-${prev}`, { replace: true })
    }, [user, currentStep, navigate])

    const goToDashboard = useCallback(() => {
        navigate('/')
    }, [navigate])

    return {
        currentStep,
        data,
        updateData,
        nextStep,
        prevStep,
        isLoading,
        goToDashboard
    }
}
