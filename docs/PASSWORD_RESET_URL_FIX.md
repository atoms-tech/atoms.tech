# Password Reset URL Fix

## Issue

Password reset URLs were returning 404 errors when users clicked the link from their email.

**Example failing URL**: `https://atoms.tech/reset-password?token=xxx`

## Root Cause

The password reset page is located at `/auth/reset-password` (not `/reset-password`) due to the Next.js route group structure:

```
src/app/(auth)/auth/reset-password/page.tsx
```

This creates the route: `/auth/reset-password`

## Solution

### 1. Updated Environment Variables

**Development** (`.env.local`):
```bash
WORKOS_PASSWORD_RESET_URL=http://localhost:3000/auth/reset-password
```

**Production** (Vercel):
```bash
WORKOS_PASSWORD_RESET_URL=https://atoms.tech/auth/reset-password
```

### 2. Updated Documentation

All documentation files now reference the correct URL pattern:
- `docs/WORKOS_EMAIL_CONFIGURATION.md`
- `docs/DATABASE_EMAIL_FIX_SUMMARY.md`
- `.env.example`

### 3. WorkOS Dashboard Configuration

**IMPORTANT**: Update the password reset redirect URL in WorkOS Dashboard:

1. Go to: https://dashboard.workos.com/authentication
2. Click "Redirects" tab
3. Add/Update password reset URL:
   - **Development**: `http://localhost:3000/auth/reset-password?token={token}`
   - **Production**: `https://atoms.tech/auth/reset-password?token={token}`

## Correct URL Format

**Development**: `http://localhost:3000/auth/reset-password?token={token}`
**Production**: `https://atoms.tech/auth/reset-password?token={token}`

Note the `/auth/` prefix before `reset-password`.

## Security Note

The password reset token is NOT displayed to users in the UI. It is only sent via email and passed as a URL parameter. The forgot password page (`/forgot-password`) only shows a success message without revealing the token.

## Testing

To test the password reset flow:

1. Go to: http://localhost:3000/forgot-password
2. Enter your email
3. Check your email for the reset link
4. Click the link (should go to `/auth/reset-password?token=xxx`)
5. Enter new password
6. Verify password was reset successfully

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `WORKOS_PASSWORD_RESET_URL` in Vercel to `https://atoms.tech/auth/reset-password`
- [ ] Update WorkOS Dashboard redirect URL to `https://atoms.tech/auth/reset-password?token={token}`
- [ ] Test password reset flow in production
- [ ] Verify emails are being sent via Resend
- [ ] Check Vercel logs for any errors

## Related Files

- Password reset page: `src/app/(auth)/auth/reset-password/page.tsx`
- Forgot password page: `src/app/(auth)/forgot-password/page.tsx`
- Auth actions: `src/app/(auth)/auth/actions.ts` (requestPasswordReset, resetPassword)
- Environment config: `.env.local`, `.env.example`
- Documentation: `docs/WORKOS_EMAIL_CONFIGURATION.md`
