import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'))
const UpdatePasswordPage = React.lazy(() => import('./pages/UpdatePasswordPage'))
import { AuthCallback } from './components/auth/AuthCallback/AuthCallback'

const LoadingSpinner = () => (
  <div className="app-loading-container">
    <div className="app-spinner"></div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Route: Auth Required, Onboarding NOT Required (Wizard) */}
            <Route path="/register" element={
              <ProtectedRoute requireOnboardingComplete={false}>
                <OnboardingPage />
              </ProtectedRoute>
            } />

            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Protected Route: Auth Required, Onboarding Required (Dashboard) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
