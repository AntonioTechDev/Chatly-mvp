import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
const RegisterPage = React.lazy(() => import('./pages/RegisterPage')) // Added


const LoadingSpinner = () => (
  <div className="app-loading-container">
    <div className="app-spinner"></div>
  </div>
)

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
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
            <Route path="/register" element={<RegisterPage />} /> {/* Added */}

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
