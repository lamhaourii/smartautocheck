# User Service v2.0 - Enhanced

Enhanced user management and authentication service with refresh tokens, password reset, and preferences.

## 🆕 What's New in v2.0

- ✅ **Refresh Token System** - Access tokens (15min) + Refresh tokens (7d)
- ✅ **Password Reset Flow** - Email-based password reset with tokens
- ✅ **User Preferences** - JSONB storage for user settings
- ✅ **Email Notifications** - Welcome emails, password reset emails
- ✅ **Token Cleanup Cron** - Automatic cleanup of expired tokens
- ✅ **Enhanced Logging** - Winston structured logging
- ✅ **Better Health Checks** - Liveness, readiness, detailed health
- ✅ **Role Authorization** - Middleware for role-based access

## API Endpoints

### Authentication
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout (revoke refresh token)
POST   /api/auth/refresh-token      - Get new access token
```

### Password Reset
```
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
```

### Profile
```
GET    /api/auth/profile            - Get user profile
PUT    /api/auth/preferences        - Update user preferences
```

### Health
```
GET    /health                      - Detailed health check
GET    /health/live                 - Liveness probe
GET    /health/ready                - Readiness probe
```

## Features

### Refresh Token Flow
1. Login returns both `accessToken` and `refreshToken`
2. Access token expires in 15 minutes
3. Use refresh token to get new access token
4. Refresh token expires in 7 days
5. Logout revokes refresh token

### Password Reset Flow
1. Request reset → Email sent with token
2. Token valid for 1 hour
3. Reset password with token
4. Token cleared after successful reset

### Token Cleanup
- Cron job runs daily at 2:00 AM
- Removes expired refresh tokens
- Keeps database clean

## Environment Variables

```env
JWT_SECRET=your-256-bit-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3010
```

## Usage Examples

### Register & Login
```javascript
// Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const { data } = await response.json();
// data.accessToken - use for API calls
// data.refreshToken - store securely
```

### Refresh Access Token
```javascript
const response = await fetch('/api/auth/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: storedRefreshToken
  })
});

const { data } = await response.json();
// data.accessToken - new access token
```

### Password Reset
```javascript
// Step 1: Request reset
await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Step 2: User clicks link in email, gets token
// Step 3: Reset password
await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: tokenFromEmail,
    newPassword: 'NewSecurePass123'
  })
});
```

## Testing

```bash
npm test
npm run test:watch
```

## License

MIT
