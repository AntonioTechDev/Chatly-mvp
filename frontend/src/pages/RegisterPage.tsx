import React from 'react'
import { WizardProvider } from '../components/auth/RegistrationWizard/WizardContext'
import { WizardContainer } from '../components/auth/RegistrationWizard/WizardContainer'

const RegisterPage: React.FC = () => {
    return (
        <WizardProvider>
            <WizardContainer />
        </WizardProvider>
    )
}

export default RegisterPage
