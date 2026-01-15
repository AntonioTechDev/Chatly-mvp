import React from 'react'
import { Outlet } from 'react-router-dom'
import { WizardProvider } from './WizardContext'

interface WizardLayoutProps {
    children?: React.ReactNode
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
    return (
        <WizardProvider>
            {children || <Outlet />}
        </WizardProvider>
    )
}
