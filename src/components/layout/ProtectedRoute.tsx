import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/core/contexts/AuthContext'

import './ProtectedRoute.css'
import SpinnerIcon from '@/img/spinner.svg?react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="protected-route-container">
        <div className="loading-content">
          <SpinnerIcon className="loading-spinner" />
          <p className="loading-text">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Render children if authenticated
  return <>{children}</>
}

export default ProtectedRoute
