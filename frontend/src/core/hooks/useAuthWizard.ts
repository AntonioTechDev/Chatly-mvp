import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { type WizardData, INITIAL_WIZARD_DATA } from '../types/auth-wizard.types'
import { authWizardService } from '../services/authWizardService'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export const useAuthWizard = () => {
    const [currentStep, setCurrentStep] = useState(1)
    const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }, [])

    const nextStep = useCallback(async () => {
        setIsLoading(true)
        try {
            if (user) {
                // Save progress to DB if user is authenticated (Step 2+)
                await authWizardService.saveStepData(user.id, currentStep, data)
            }

            setCurrentStep(prev => prev + 1)
        } catch (error) {
            console.error('Failed to save wizard progress', error)
            toast.error('Errore durante il salvataggio dei dati')
        } finally {
            setIsLoading(false)
        }
    }, [user, data])

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(1, prev - 1))
    }, [])

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
