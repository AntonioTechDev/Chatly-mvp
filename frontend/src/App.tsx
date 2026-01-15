import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/core/contexts/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Lazy loaded pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const InboxPage = React.lazy(() => import('./pages/InboxPage'))
const UserInfoPage = React.lazy(() => import('./pages/UserInfoPage'))
const ContactsPage = React.lazy(() => import('./pages/ContactsPage'))
const DocumentsPage = React.lazy(() => import('./pages/DocumentsPage'))

const LogActivityPage = React.lazy(() => import('./pages/LogActivityPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage')) // Optional now
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'))
const UpdatePasswordPage = React.lazy(() => import('./pages/UpdatePasswordPage'))

import { WizardLayout } from './components/auth/RegistrationWizard/WizardLayout'
import { WizardContainer } from './components/auth/RegistrationWizard/WizardContainer'
import { AuthCallback } from './components/auth/AuthCallback/AuthCallback'


const LoadingSpinner = () => (
  <div className="app-loading-container">
    <div className="app-spinner"></div>
  </div>
)

const RootRedirect = () => {
  const { isAuthenticated, isLoading, clientData, profile } = useAuth()
  const navigate = useNavigate()
  const hasAttemptedRedirect = React.useRef(false)

  React.useEffect(() => {
    if (isLoading) return

    // Guard against infinite redirect loops
    if (hasAttemptedRedirect.current) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      hasAttemptedRedirect.current = true
      navigate('/login', { replace: true })
      return
    }

    // Authenticated but profile doesn't exist yet
    // This happens for new OAuth users or users still in signup
    if (!profile || !clientData) {
      hasAttemptedRedirect.current = true
      // Redirect to Step 3 (onboarding for authenticated users)
      navigate('/onboarding/step-3', { replace: true })
      return
    }

    // Profile exists - check onboarding completion
    const step = profile.onboarding_step || 1
    const isCompleted = profile.onboarding_status === 'completed' || step >= 7

    if (isCompleted) {
      hasAttemptedRedirect.current = true
      navigate('/dashboard', { replace: true })
      return
    }

    // Onboarding in progress - resume from current step
    const targetStep = Math.max(step, 3)
    hasAttemptedRedirect.current = true
    navigate(`/onboarding/step-${targetStep}`, { replace: true })

  }, [isAuthenticated, isLoading, clientData, profile, navigate])

  return <LoadingSpinner />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />


            {/* Wizard Routes - Wrapped in Layout to persist state */}
            {/* Wizard Routes - Explicitly wrapped to ensure correct matching and persistence */}
            <Route path="/register" element={
              <WizardLayout>
                <WizardContainer />
              </WizardLayout>
            } />
            <Route path="/onboarding/step-:step" element={
              <WizardLayout>
                <WizardContainer />
              </WizardLayout>
            } />
            <Route path="/onboarding" element={<Navigate to="/onboarding/step-1" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-info"
              element={
                <ProtectedRoute>
                  <UserInfoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <ContactsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-activity"
              element={
                <ProtectedRoute>
                  <LogActivityPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
