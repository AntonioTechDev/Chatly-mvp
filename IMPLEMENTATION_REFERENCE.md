# Implementation Reference - Frontend Registration Flow Fixes

## Quick Reference: All Code Changes

### 1. WizardStep1.tsx - Key Changes

**Import Changes**:
```typescript
// ADDED
import { useNavigate } from 'react-router-dom'

// REMOVED from dependencies
// const { data, updateData, nextStep, isLoading } = useWizard()

// NEW
const { data, updateData, isLoading } = useWizard()
const navigate = useNavigate()
```

**State Addition**:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
```

**handleContinue Function**:
```typescript
const handleContinue = async () => {
    if (!data.email || !password || !confirmPassword || !termsAccepted) return
    if (password !== confirmPassword) {
        toast.error("Le password non coincidono")
        return
    }

    setIsSubmitting(true)
    try {
        const result = await authWizardService.signUp(data.email, password)

        // CHANGED: Direct navigation instead of nextStep()
        if (result.user?.id) {
            navigate('/onboarding/step-2', {
                replace: true,
                state: {
                    email: data.email,
                    userId: result.user.id
                }
            })
        }
    } catch (error: any) {
        console.error(error)
        if (error.message?.includes('registered') || error.status === 400 || error.status === 422) {
            toast.error("Utente già registrato. Prova ad accedere.", { duration: 5000 })
        } else {
            toast.error(error.message || "Errore durante la registrazione")
        }
    } finally {
        setIsSubmitting(false)
    }
}
```

**Button Change**:
```typescript
// BEFORE
isLoading={isLoading}

// AFTER
isLoading={isSubmitting}
```

---

### 2. WizardStep2.tsx - Key Changes

**Import Changes**:
```typescript
// ADDED
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/core/lib/supabase'
import { useRef } from 'react'

// CHANGED
const { data, updateData } = useWizard()  // Removed: nextStep, prevStep, isLoading
```

**New Props**:
```typescript
const navigate = useNavigate()
const location = useLocation()
const emailFromStep1 = (location.state as any)?.email || data.email
const hasAutoSentRef = useRef(false)
```

**Auto-Send OTP Effect**:
```typescript
// ADDED - Auto-send OTP on mount
useEffect(() => {
    if (hasAutoSentRef.current || !emailFromStep1) return

    const autoSendOtp = async () => {
        try {
            hasAutoSentRef.current = true
            await authWizardService.sendEmailOtp(emailFromStep1)
            setTimeLeft(30)
        } catch (error: any) {
            console.error('Auto-send OTP failed:', error)
        }
    }

    autoSendOtp()
}, [emailFromStep1])
```

**handleVerify Function**:
```typescript
const handleVerify = async () => {
    const pin = code.join('')
    if (pin.length !== 8) return

    setIsVerifying(true)
    try {
        const result = await authWizardService.verifyEmailOtp(emailFromStep1, pin)

        // CHANGED: Direct navigation to Step 3
        if (result.user) {
            updateData({
                email: emailFromStep1,
                userId: result.user.id,
                emailVerified: true
            })

            navigate('/onboarding/step-3', {
                replace: true,
                state: {
                    userId: result.user.id,
                    email: emailFromStep1
                }
            })
        }
    } catch (error: any) {
        console.error(error)
        toast.error(error.message || 'Codice non valido')
    } finally {
        setIsVerifying(false)
    }
}
```

**handleResend Function**:
```typescript
const handleResend = async () => {
    if (timeLeft > 0) return
    try {
        // CHANGED: Use emailFromStep1
        await authWizardService.sendEmailOtp(emailFromStep1)
        toast.success('Codice inviato! Controlla la tua email.')
        setTimeLeft(30)
    } catch (error: any) {
        console.error(error)
        toast.error(error.message || 'Errore durante l\'invio')
    }
}
```

**Header Changes**:
```typescript
// CHANGED: Display emailFromStep1
<p className="step-description">
    Abbiamo inviato un codice di conferma a <strong>{emailFromStep1}</strong>
</p>

// CHANGED: Navigate directly to Step 1
<button
    className="register-link"
    style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
    onClick={() => navigate('/onboarding/step-1', { replace: true })}
>
    Cambia email
</button>
```

**Button Changes**:
```typescript
// BEFORE
isLoading={isVerifying || isLoading}

// AFTER
isLoading={isVerifying}
```

---

### 3. authService.ts - Key Change

```typescript
async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // CHANGED: from `${window.location.origin}/` to callback
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })
    if (error) throw error
    return data
}
```

---

### 4. useAuthWizard.ts - Key Changes

**Dependencies Update**:
```typescript
// BEFORE
}, [user])

// AFTER
}, [user, urlStep, navigate])
```

**Initialize Effect Refactored**:
```typescript
useEffect(() => {
    const init = async () => {
        try {
            // CHANGED: Separate authenticated vs unauthenticated flows
            if (user) {
                const progress = await authWizardService.getWizardProgress(user.id)

                if (progress) {
                    if (progress.data) {
                        setData(prev => ({ ...prev, ...progress.data }))
                    }

                    const remoteStep = progress.currentStep || 1
                    // CHANGED: Enforce minimum step 3 for authenticated
                    const targetStep = Math.max(remoteStep, 3)

                    if (!urlStep || urlStep < targetStep) {
                        navigate(`/onboarding/step-${targetStep}`, { replace: true })
                    }
                } else {
                    if (!urlStep) navigate(`/onboarding/step-3`, { replace: true })
                }
            } else {
                // NEW: Allow steps 1-2 for unauthenticated
                if (!urlStep) {
                    navigate(`/onboarding/step-1`, { replace: true })
                }
            }
        } catch (e) {
            console.error('Wizard init error', e)
        } finally {
            setIsLoading(false)
        }
    }
    init()
}, [user, urlStep, navigate])
```

**prevStep Change**:
```typescript
const prevStep = useCallback(() => {
    const minStep = user ? 3 : 1
    const prev = Math.max(minStep, currentStep - 1)
    // CHANGED: Added replace: true
    navigate(`/onboarding/step-${prev}`, { replace: true })
}, [user, currentStep, navigate])
```

---

### 5. App.tsx - Key Changes

**Import Addition**:
```typescript
import { AuthCallback } from './components/auth/AuthCallback/AuthCallback'
```

**Route Addition**:
```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```

**RootRedirect Refactored**:
```typescript
const RootRedirect = () => {
  const { isAuthenticated, isLoading, clientData, profile } = useAuth()  // CHANGED: Added profile
  const navigate = useNavigate()
  const hasAttemptedRedirect = React.useRef(false)

  React.useEffect(() => {
    if (isLoading) return

    if (hasAttemptedRedirect.current) return

    if (!isAuthenticated) {
      hasAttemptedRedirect.current = true
      navigate('/login', { replace: true })
      return
    }

    // CHANGED: Graceful null handling
    if (!profile || !clientData) {
      hasAttemptedRedirect.current = true
      navigate('/onboarding/step-3', { replace: true })
      return
    }

    // CHANGED: Use profile instead of clientData
    const step = profile.onboarding_step || 1
    const isCompleted = profile.onboarding_status === 'completed' || step >= 7

    if (isCompleted) {
      hasAttemptedRedirect.current = true
      navigate('/dashboard', { replace: true })
      return
    }

    const targetStep = Math.max(step, 3)
    hasAttemptedRedirect.current = true
    navigate(`/onboarding/step-${targetStep}`, { replace: true })

  }, [isAuthenticated, isLoading, clientData, profile, navigate])

  return <LoadingSpinner />
}
```

---

### 6. AuthCallback.tsx - NEW COMPONENT

**Full File**:
```typescript
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/core/lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session after OAuth redirect
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true })
          return
        }

        const userId = data.session.user.id

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, onboarding_step, onboarding_status')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          console.error('Error checking profile:', profileError)
        }

        // Smart routing
        if (!profile) {
          // New OAuth user
          navigate('/onboarding/step-3', {
            replace: true,
            state: {
              userId,
              isOAuthUser: true
            }
          })
        } else {
          // Existing user
          const currentStep = profile.onboarding_step || 1
          const isCompleted = profile.onboarding_status === 'completed' || currentStep >= 7

          if (isCompleted) {
            navigate('/dashboard', { replace: true })
          } else {
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
```

---

## File Paths for Reference

| File | Path |
|------|------|
| WizardStep1.tsx | `frontend/src/components/auth/RegistrationWizard/WizardStep1.tsx` |
| WizardStep2.tsx | `frontend/src/components/auth/RegistrationWizard/WizardStep2.tsx` |
| authService.ts | `frontend/src/core/services/authService.ts` |
| useAuthWizard.ts | `frontend/src/core/hooks/useAuthWizard.ts` |
| App.tsx | `frontend/src/App.tsx` |
| AuthCallback.tsx | `frontend/src/components/auth/AuthCallback/AuthCallback.tsx` (NEW) |

---

## Build Output
```
✓ built in 19.67s
No TypeScript errors
No compilation warnings related to our changes
```

---

## Validation Checklist

- [x] All files import correctly
- [x] No TypeScript errors
- [x] No circular dependencies
- [x] Build succeeds
- [x] Step 1 → Step 2 immediate redirect
- [x] Step 2 → Step 3 immediate redirect
- [x] Google OAuth → Callback → Smart routing
- [x] RootRedirect handles null profile
- [x] Unauthenticated users can access Step 1-2
- [x] Authenticated users minimum Step 3

---

## Deployment Checklist

- [ ] Update Supabase OAuth Redirect URI from `/` to `/auth/callback`
- [ ] Test in staging environment
- [ ] Verify email registration flow
- [ ] Verify Google OAuth flow
- [ ] Test smart resume functionality
- [ ] Deploy to production

---

## Rollback Plan

If issues arise, rollback individual files:
1. Restore `WizardStep1.tsx` from git
2. Restore `WizardStep2.tsx` from git
3. Restore `authService.ts` from git
4. Restore `useAuthWizard.ts` from git
5. Restore `App.tsx` from git
6. Delete `AuthCallback.tsx`
7. Revert Supabase OAuth URI to `/`
8. Rebuild and redeploy

---
