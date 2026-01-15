# Frontend Integration Guide - New Onboarding Flow

This guide helps the frontend engineer integrate the new two-phase authentication system for the registration wizard.

## Architecture Overview

```
Step 1-2: PUBLIC (No JWT needed)
  ↓
User gets accessToken + refreshToken from Step 2
  ↓
Step 3+: PROTECTED (JWT required in header)
```

## Step 1: Email & Password Registration

### Endpoint
```
POST /api/onboarding/step-1
```

### No Authorization Header Required

### Request Body
```typescript
interface Step1Request {
  email: string;        // Valid email format
  password: string;     // At least 8 characters
}
```

### Example Request
```typescript
const response = await fetch('http://localhost:3000/api/onboarding/step-1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'automagruppoitalia@gmail.com',
    password: 'SecurePassword123'
  })
});
```

### Response (200 OK)
```typescript
interface Step1Response {
  success: boolean;
  message: string;                    // "Account created. Check your email for the OTP code."
  userId: string;                     // UUID - store locally
  email: string;
  needsOtpVerification: boolean;      // true
}

// Example response
{
  "success": true,
  "message": "Account created. Check your email for the OTP code.",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "automagruppoitalia@gmail.com",
  "needsOtpVerification": true
}
```

### Error Responses

#### 400 Bad Request - Invalid Email
```json
{
  "statusCode": 400,
  "message": "Email must be a valid email address"
}
```

#### 400 Bad Request - Password Too Short
```json
{
  "statusCode": 400,
  "message": "Password must be at least 8 characters"
}
```

#### 400 Bad Request - Email Already Exists
```json
{
  "statusCode": 400,
  "message": "This email is already registered"
}
```

### Integration Example (React Component)
```typescript
// WizardStep1.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function WizardStep1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Create user account
      const response = await fetch('http://localhost:3000/api/onboarding/step-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create account');
        return;
      }

      const data = await response.json();

      // Store email and userId for Step 2
      localStorage.setItem('onboarding_email', email);
      localStorage.setItem('onboarding_userId', data.userId);

      // Redirect to Step 2 (OTP verification)
      navigate('/onboarding/step-2');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Continue to Email Verification'}
      </button>
    </form>
  );
}
```

## Step 2: OTP Verification

### Endpoint
```
POST /api/onboarding/step-2/verify-otp
```

### No Authorization Header Required

### Request Body
```typescript
interface Step2Request {
  email: string;    // From Step 1
  otp: string;      // 6-digit code from email
}
```

### Example Request
```typescript
const response = await fetch('http://localhost:3000/api/onboarding/step-2/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'automagruppoitalia@gmail.com',
    otp: '123456'
  })
});
```

### Response (200 OK)
```typescript
interface Step2Response {
  success: boolean;
  message: string;                    // "Email verified successfully"
  userId: string;
  email: string;
  accessToken: string;                // JWT token - USE THIS for Steps 3+
  refreshToken: string;               // For token refresh when accessToken expires
  profile: {
    id: string;
    email: string;
    role: string;
    phone_number: null | string;
    phone_verified: boolean;
  };
  readyForStep3: boolean;             // true
}

// Example response
{
  "success": true,
  "message": "Email verified successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "automagruppoitalia@gmail.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImF1dG9tYWdydXBwb2l0YWxpYUBnbWFpbC5jb20iLCJpYXQiOjE2NDYxMjM2MDB9.jIUCsC5RiD_QvQzOQX2XQf_QX2XQf_QX2XQf_QX2XQf",
  "refreshToken": "ref_token_550e8400e29b41d4a716446655440000",
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "automagruppoitalia@gmail.com",
    "role": "business_owner",
    "phone_number": null,
    "phone_verified": false
  },
  "readyForStep3": true
}
```

### Error Responses

#### 401 Unauthorized - Invalid/Expired OTP
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP code. Please try again."
}
```

#### 400 Bad Request - Invalid Email
```json
{
  "statusCode": 400,
  "message": "Email must be a valid email address"
}
```

### Integration Example (React Component)
```typescript
// WizardStep2.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';  // Your auth context

export function WizardStep2() {
  const navigate = useNavigate();
  const { setAccessToken, setRefreshToken, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Get email from Step 1
    const storedEmail = localStorage.getItem('onboarding_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 2: Verify OTP and get session tokens
      const response = await fetch('http://localhost:3000/api/onboarding/step-2/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to verify OTP');
        return;
      }

      const data = await response.json();

      // CRITICAL: Store tokens for authenticated requests
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.profile));

      // Update auth context
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.profile);

      // Clear onboarding data
      localStorage.removeItem('onboarding_email');
      localStorage.removeItem('onboarding_userId');

      // Redirect to Step 3 with tokens now available
      navigate('/onboarding/step-3');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      // This endpoint doesn't exist yet - you may need to implement it
      // For now, user can request new registration link
      alert('Please check your email for a new OTP code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerifyOtp}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          readOnly
          disabled
        />
      </div>
      <div>
        <label>Verification Code</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          pattern="\d{6}"
          required
        />
        <small>Check your email for the 6-digit code</small>
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading || otp.length !== 6}>
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>
      <button type="button" onClick={handleResendOtp} disabled={resendLoading}>
        {resendLoading ? 'Resending...' : 'Resend Code'}
      </button>
    </form>
  );
}
```

## Steps 3+: Protected Endpoints

### ALL requests must include Authorization header

### Request Headers
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`  // From Step 2
}
```

### Example: Step 3 (Company Information)
```typescript
const response = await fetch('http://localhost:3000/api/onboarding/step-3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  },
  body: JSON.stringify({
    companyName: 'Acme Corp',
    website: 'https://acme.com',
    industry: 'Technology',
    employeeCount: '50-100'
  })
});
```

### Error Handling for Protected Endpoints

#### 401 Unauthorized - Missing Token
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

When you get 401, the token is missing or invalid. Redirect to Step 1.

#### 401 Unauthorized - Expired Token
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

When token expires, use refreshToken to get a new one (if implemented), or redirect to Step 1.

## Auth Context Setup

### Create AuthContext.tsx
```typescript
import { createContext, useState, useContext, ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  phone_number?: string;
  phone_verified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Onboarding
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useState(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  });

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        setUser,
        setAccessToken,
        setRefreshToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## API Client Setup

### Create apiClient.ts
```typescript
import { useAuth } from './contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export function useApiClient() {
  const { accessToken, logout } = useAuth();

  async function apiFetch(
    endpoint: string,
    options: FetchOptions = {}
  ) {
    const { requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add Authorization header for protected endpoints
    if (requiresAuth && accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  return { apiFetch };
}

// Usage in components:
// const { apiFetch } = useApiClient();
//
// // Public endpoints (Step 1-2)
// const result = await apiFetch('/onboarding/step-1', {
//   method: 'POST',
//   body: JSON.stringify({ email, password }),
//   requiresAuth: false
// });
//
// // Protected endpoints (Step 3+)
// const result = await apiFetch('/onboarding/step-3', {
//   method: 'POST',
//   body: JSON.stringify({ companyName, industry }),
//   requiresAuth: true  // default
// });
```

## Protected Route Component

### Create ProtectedRoute.tsx
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  minStep?: number;
}

export function ProtectedRoute({ children, minStep = 3 }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  // If user not authenticated, redirect to Step 1
  if (!isAuthenticated) {
    return <Navigate to="/onboarding/step-1" replace />;
  }

  // All authenticated users can access steps 3+
  return <>{children}</>;
}

// Usage in router:
// <Route path="/onboarding/step-3" element={<ProtectedRoute><Step3 /></ProtectedRoute>} />
```

## Token Management

### Access Token Lifecycle
```
Step 2: Receive accessToken (short-lived, ~1 hour)
  ↓
Use in Authorization header: Bearer {accessToken}
  ↓
If expires → 401 Unauthorized
  ↓
Option A: Redirect to login
Option B: Use refreshToken to get new accessToken (if implemented)
```

### Simple Token Expiry Check (Optional Enhancement)
```typescript
// utils/token.ts
import jwtDecode from 'jwt-decode';

interface DecodedToken {
  exp: number;  // expiration timestamp
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

// Usage:
// if (isTokenExpired(accessToken)) {
//   // Try to refresh or redirect to login
// }
```

## Complete Integration Checklist

- [ ] Step 1 endpoint integrated and tested
- [ ] Step 2 endpoint integrated and tested
- [ ] Tokens stored in localStorage/context
- [ ] Authorization header added to all Step 3+ requests
- [ ] 401 errors handled (redirect to Step 1)
- [ ] AuthContext created and provided
- [ ] Protected routes implemented
- [ ] Full end-to-end flow tested
- [ ] Error messages displayed to user
- [ ] OTP input limited to 6 digits
- [ ] Form validation working
- [ ] Loading states implemented
- [ ] Can't proceed without proper input

## Troubleshooting

### Step 1 shows "Email already registered"
- User already has account
- Option 1: Direct them to login
- Option 2: Implement "forgot password"

### Step 2 shows "Invalid or expired OTP"
- OTP code incorrect
- OTP expired (usually 10 minutes)
- User entered wrong email in Step 1
- Solution: Ask user to restart (go back to Step 1)

### Step 3 shows "Unauthorized"
- accessToken not stored properly from Step 2
- accessToken not included in Authorization header
- accessToken expired
- Solution: Verify tokens in localStorage and header

### CORS Errors
- Backend not configured for frontend origin
- Check backend CORS settings in main.ts
- `app.enableCors({ origin: 'http://localhost:5173' })`

### OTP Email Not Received
- Check Supabase email settings
- Check spam folder
- Verify email address is correct
- Check Supabase logs for errors

## Testing Credentials

For development/testing:
- Email: `test@example.com` or any email
- Password: Must be 8+ characters
- OTP: Will be sent to email inbox

For mock OTP testing (if needed):
- Test OTP codes: `123456` or `987654` (backend configured for testing)

## Next Steps

1. Implement Step 1 component using the examples above
2. Implement Step 2 component and token storage
3. Update existing Step 3-7 components to use Authorization header
4. Set up AuthContext and protected routes
5. Test full flow locally
6. Deploy to staging for QA testing
7. Deploy to production

---

For questions about backend implementation, refer to `ONBOARDING_FIX_SUMMARY.md`
For architectural decisions, refer to `ONBOARDING_FLOW_DIAGRAM.md`
