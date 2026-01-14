import React, { createContext, useContext, ReactNode } from 'react'
import { useAuthWizard } from '@/core/hooks/useAuthWizard'
import { WizardData } from '@/core/types/auth-wizard.types'

interface WizardContextType {
    currentStep: number
    data: WizardData
    updateData: (updates: Partial<WizardData>) => void
    nextStep: () => Promise<void>
    prevStep: () => void
    isLoading: boolean
    goToDashboard: () => void
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const wizard = useAuthWizard()

    return (
        <WizardContext.Provider value={wizard}>
            {children}
        </WizardContext.Provider>
    )
}

export const useWizard = () => {
    const context = useContext(WizardContext)
    if (!context) {
        throw new Error('useWizard must be used within a WizardProvider')
    }
    return context
}
