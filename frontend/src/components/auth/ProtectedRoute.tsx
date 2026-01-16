import React, { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireOnboardingComplete?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireOnboardingComplete = true
}) => {
    const { isAuthenticated, isLoading, clientData } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    // 1. Check Authentication
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 2. Check Onboarding Status
    // Assuming 'COMPLETED' is the status string for finished onboarding
    // Adjust this based on your actual status values (e.g., 'active', 'completed')
    const isOnboardingComplete = clientData?.onboarding_status === 'COMPLETED' || clientData?.onboarding_status === 'active'

    if (requireOnboardingComplete && !isOnboardingComplete) {
        // User tries to access Dashboard but is not ready -> Send to Wizard
        return <Navigate to="/register" replace />
    }

    if (!requireOnboardingComplete && isOnboardingComplete) {
        // User tries to access Wizard but is already done -> Send to Dashboard
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
