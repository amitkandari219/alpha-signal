# Alpha Signal Authentication System

## Overview

Complete JWT-based authentication system with token refresh, rate limiting, and protected routes.

---

## Backend Implementation (`apps/api`)

### Auth Routes (`src/routes/auth.ts`)

**Endpoints:**

1. **POST /auth/register**
   - Creates new user account
   - Validates email format and password strength
   - Hashes password with bcrypt (10 rounds)
   - Assigns FREE tier by default
   - Returns JWT access token (15min) + refresh token (7 days)

2. **POST /auth/login**
   - Validates credentials
   - Rate limited: 5 attempts per minute per IP
   - Updates lastLoginAt timestamp
   - Returns JWT tokens + user object

3. **POST /auth/refresh**
   - Accepts refresh token in request body
   - Validates and returns new access token
   - Refresh tokens stored in-memory Map (use Redis in production)

4. **POST /auth/logout**
   - Accepts refresh token in request body
   - Invalidates refresh token
   - Clears user session

5. **GET /auth/me**
   - Protected route (requires valid JWT)
   - Returns current user information

**Security Features:**
- ✅ Bcrypt password hashing
- ✅ Rate limiting (5 login attempts/min/IP)
- ✅ JWT with short expiry (15min access, 7 days refresh)
- ✅ Refresh token rotation
- ✅ Input validation with Zod schemas

**Request/Response Examples:**

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'

# Response
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "tier": "FREE"
  }
}

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

# Refresh Token
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'

# Logout
curl -X POST http://localhost:4000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

---

### GraphQL Auth Middleware (`src/index.ts`)

GraphQL context automatically extracts JWT from `Authorization: Bearer <token>` header:

```typescript
context: async (request: any) => {
  let user = null;

  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = fastify.jwt.verify(token);
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    }
  } catch (error) {
    // Invalid token, continue without user
  }

  return { fastify, loaders, user };
}
```

Protected GraphQL resolvers can check `context.user`:

```typescript
const authenticateUser = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
};
```

---

## Frontend Implementation (`apps/web`)

### Auth Store (`src/store/useAuthStore.ts`)

Zustand store with persistence managing auth state:

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email, password) => Promise<void>;
  register: (email, password, name?) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}
```

**Key Features:**
- Persists tokens to localStorage
- Auto-refreshes expired access tokens
- Clears auth on logout or refresh failure

**Usage:**

```tsx
import { useAuthStore } from './store/useAuthStore';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

---

### Auth Pages

#### Login Page (`src/pages/auth/Login.tsx`)

**Features:**
- Dark theme with floating labels
- Email + password validation
- "Remember me" checkbox (UI only)
- Forgot password link (placeholder)
- Loading states with spinner
- Error messages below form
- Redirects to intended page after login
- Link to register page

**UI Components:**
- Floating label inputs
- Professional dark theme
- Validation feedback
- Loading spinner on submit
- Error message display

#### Register Page (`src/pages/auth/Register.tsx`)

**Features:**
- Name, email, password, confirm password fields
- Client-side validation:
  - Name: min 2 characters
  - Email: valid format
  - Password: min 8 characters
  - Confirm: must match password
- Real-time validation feedback
- Loading states
- Error messages per field
- Success redirect to dashboard
- Link to login page

---

### API Client with Token Refresh (`src/lib/apiClient.ts`)

Axios instance with automatic token refresh interceptor:

**How it Works:**

1. **Request Interceptor:**
   - Adds `Authorization: Bearer <token>` to every request
   - Gets token from auth store automatically

2. **Response Interceptor:**
   - Detects 401 Unauthorized responses
   - Automatically calls refresh token endpoint
   - Retries original request with new token
   - Queues multiple failed requests during refresh
   - Logs out user if refresh fails

**Usage:**

```tsx
import { apiClient } from './lib/apiClient';

// Automatically includes auth token
const response = await apiClient.get('/api/protected-endpoint');

// If token expired:
// 1. Intercepts 401 error
// 2. Refreshes token automatically
// 3. Retries request with new token
// 4. Returns successful response
```

**Features:**
- ✅ Automatic token refresh on 401
- ✅ Request queuing during refresh
- ✅ Single refresh for multiple failed requests
- ✅ Auto-logout on refresh failure
- ✅ Redirect to /login when auth invalid

---

### Protected Routes (`src/components/auth/ProtectedRoute.tsx`)

Wrapper component that guards authenticated routes:

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**Behavior:**
- Checks `isAuthenticated` from auth store
- Redirects to `/login` if not authenticated
- Preserves intended destination in state
- Redirects back after successful login

**Implementation in App.tsx:**

```tsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<Dashboard />} />
  {/* All child routes are protected */}
</Route>
```

---

### Header Integration (`src/components/layout/Header.tsx`)

**Changes:**
- Gets `user` from `useAuthStore` (not `useAppStore`)
- "Sign In" button navigates to `/login`
- Logout button calls `logout()` and redirects
- Shows user avatar, name, email, tier badge
- Dropdown menu with Settings, Billing, Sign Out

**Logout Flow:**

```tsx
const { logout } = useAuthStore();

const handleLogout = async () => {
  await logout(); // Calls API and clears local state
  navigate('/login');
};
```

---

## Routes

### Public Routes (No Auth Required)
- `/login` - Login page
- `/register` - Registration page

### Protected Routes (Auth Required)
- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard
- `/screener` - Stock screener
- `/watchlist` - User watchlists
- `/sectors` - Sector analysis
- `/trends` - Market trends
- `/portfolio` - Portfolio tracking
- `/alerts` - Price alerts
- `/settings` - User settings
- `/design-system` - Design showcase

**Redirect Behavior:**
- Unauthenticated users redirected to `/login`
- After login, redirected to intended page or `/dashboard`
- Invalid/expired tokens automatically refreshed

---

## Security Best Practices

### ✅ Implemented

1. **Password Security**
   - Bcrypt hashing with 10 rounds
   - Minimum 8 characters required
   - Never stored in plaintext

2. **Token Security**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Refresh token rotation
   - Tokens stored in localStorage (acceptable for MVP)

3. **Rate Limiting**
   - 5 login attempts per minute per IP
   - Prevents brute force attacks

4. **Input Validation**
   - Zod schemas on backend
   - Client-side validation on frontend
   - Email format validation
   - Password strength requirements

5. **API Security**
   - CORS configured
   - JWT signature verification
   - Authorization header required
   - GraphQL context auth checks

### 🔄 Production Improvements

1. **Refresh Token Storage**
   - Move from in-memory Map to Redis
   - Add token blacklist for logout
   - Implement token families

2. **HTTP-Only Cookies**
   - Store refresh token in HTTP-only cookie
   - More secure than localStorage
   - Requires @fastify/cookie plugin

3. **Rate Limiting**
   - Use Redis for distributed rate limiting
   - Add CAPTCHA after failed attempts
   - Implement account lockout

4. **Enhanced Security**
   - Add CSRF protection
   - Implement 2FA/MFA
   - Add email verification
   - Password reset flow
   - Session management
   - Device tracking

---

## Testing the System

### 1. Start Backend

```bash
cd apps/api
npm run dev
```

API running at: http://localhost:4000

### 2. Start Frontend

```bash
cd apps/web
npm run dev
```

Web app running at: http://localhost:3000

### 3. Test Registration

1. Navigate to http://localhost:3000
2. Should redirect to `/login`
3. Click "Create account"
4. Fill in registration form
5. Submit - should create account and redirect to dashboard

### 4. Test Login

1. Go to `/login`
2. Enter credentials
3. Click "Sign In"
4. Should redirect to dashboard with user menu visible

### 5. Test Protected Routes

1. While logged in, navigate to any route (e.g., `/screener`)
2. Should load successfully
3. Logout from user menu
4. Try to access `/screener` directly
5. Should redirect to `/login`

### 6. Test Token Refresh

1. Login and get access token
2. Wait 15+ minutes (or modify token expiry for testing)
3. Make API request through apiClient
4. Should automatically refresh token and retry request
5. No errors or logout should occur

### 7. Test Rate Limiting

1. Attempt to login with wrong password 6 times
2. 6th attempt should return 429 error
3. Wait 1 minute
4. Should be able to login again

---

## Environment Variables

### Backend (.env)

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=postgresql://user:pass@localhost:5432/alphasignal

# Optional
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:4000
```

---

## Database Schema

Users table already exists from Prisma schema:

```prisma
model User {
  id           String    @id @default(uuid()) @db.Uuid
  email        String    @unique
  passwordHash String    @map("password_hash")
  name         String?
  tier         UserTier  @default(FREE)
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  lastLoginAt  DateTime? @map("last_login_at") @db.Timestamptz(6)

  // Relations
  watchlists     Watchlist[]
  alerts         Alert[]
  userPortfolios UserPortfolio[]

  @@map("users")
}

enum UserTier {
  FREE
  PRO
  PREMIUM
}
```

---

## File Structure

```
apps/
├── api/
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.ts          # Auth endpoints
│   │   └── index.ts             # GraphQL context with JWT
│   └── package.json             # Added bcrypt, jwt
│
└── web/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.tsx
    │   │   └── layout/
    │   │       └── Header.tsx     # Updated with logout
    │   ├── lib/
    │   │   ├── apiClient.ts       # Axios interceptor
    │   │   └── mockUser.ts        # Disabled mock user
    │   ├── pages/
    │   │   └── auth/
    │   │       ├── Login.tsx
    │   │       └── Register.tsx
    │   ├── store/
    │   │   ├── useAuthStore.ts    # Auth state management
    │   │   └── useAppStore.ts     # App state
    │   └── App.tsx                # Routes with protection
    └── .env.example

```

---

## Status: ✅ Complete

All authentication features implemented and tested:

- ✅ Backend auth routes (register, login, refresh, logout)
- ✅ JWT token management (access + refresh)
- ✅ Rate limiting (5 attempts/min)
- ✅ GraphQL auth middleware
- ✅ Frontend login page (dark theme, validation)
- ✅ Frontend register page (validation, error handling)
- ✅ Zustand auth store (persistent state)
- ✅ Axios interceptor (auto token refresh)
- ✅ Protected route wrapper
- ✅ Header user menu with real logout
- ✅ Password hashing with bcrypt
- ✅ Input validation (Zod + client-side)

**Ready for use!** 🚀

Users can now register, login, access protected routes, and logout securely.

---

## Next Steps (Optional Enhancements)

1. **Password Reset Flow**
   - Forgot password page
   - Email with reset link
   - Reset password page

2. **Email Verification**
   - Send verification email on registration
   - Verify email token endpoint
   - Resend verification email

3. **Social Auth**
   - Google OAuth integration
   - GitHub OAuth integration

4. **Enhanced Security**
   - Two-factor authentication (2FA)
   - Device management
   - Login history
   - Session management

5. **User Profile**
   - Edit profile page
   - Change password
   - Upload avatar
   - Account deletion

6. **Production Ready**
   - Move refresh tokens to Redis
   - HTTP-only cookies for tokens
   - CSRF protection
   - Rate limiting with Redis
   - Audit logging

---

**Last Updated:** February 8, 2026
**Status:** Production-Ready for MVP ✅
