import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/core/lib/supabase'

/**
 * AuthCallback Component
 *
 * Handles the OAuth redirect from Supabase (Google, etc.)
 * Checks onboarding state and redirects user to appropriate step
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session after OAuth redirect
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true })
          return
        }

        const userId = data.session.user.id

        // Check if user has a profile (indicator of onboarding progress)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, onboarding_step, onboarding_status')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          console.error('Error checking profile:', profileError)
        }

        // Determine where to redirect
        if (!profile) {
          // New OAuth user - profile not created yet
          // Start at Step 3 (email already verified by OAuth provider)
          navigate('/onboarding/step-3', {
            replace: true,
            state: {
              userId,
              isOAuthUser: true
            }
          })
        } else {
          // Existing user - check onboarding progress
          const currentStep = profile.onboarding_step || 1
          const isCompleted = profile.onboarding_status === 'completed' || currentStep >= 7

          if (isCompleted) {
            // Onboarding complete
            navigate('/dashboard', { replace: true })
          } else {
            // Resume from current step
            // Ensure minimum step is 3 for OAuth users
            const targetStep = Math.max(currentStep, 3)
            navigate(`/onboarding/step-${targetStep}`, { replace: true })
          }
        }
      } catch (err) {
        console.error('AuthCallback error:', err)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  // Show loading state while processing
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <p style={{
          color: '#666',
          fontSize: '16px'
        }}>Processiamo l'accesso...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
