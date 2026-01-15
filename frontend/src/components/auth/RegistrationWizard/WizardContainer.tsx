import React from 'react'
import { useWizard } from './WizardContext'
import { WizardStep1 } from './WizardStep1'
import { WizardStep2 } from './WizardStep2'
import { WizardStep3 } from './WizardStep3'
import { WizardStep4 } from './WizardStep4'
import { WizardStep5 } from './WizardStep5'
import { WizardStep6 } from './WizardStep6'
import { WizardStep7 } from './WizardStep7'
import { AuthLayout } from '../AuthLayout'

export const WizardContainer: React.FC = () => {
    const { currentStep } = useWizard()

    // Calculate progress percentage based on 7 steps
    const progressPercentage = (currentStep / 7) * 100

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <WizardStep1 />
            case 2:
                return <WizardStep2 />
            case 3:
                return <WizardStep3 />
            case 4:
                return <WizardStep4 />
            case 5:
                return <WizardStep5 />
            case 6:
                return <WizardStep6 />
            case 7:
                return <WizardStep7 />
            default:
                return <div>Unknown Step</div>
        }
    }

    return (
        <div className="wizard-page">
            <AuthLayout>
                <div className="wizard-progress-container">
                    <div className="wizard-progress-bar">
                        <div
                            className="wizard-progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="wizard-step-content">
                    {renderStep()}
                </div>
            </AuthLayout>
        </div>
    )
}
