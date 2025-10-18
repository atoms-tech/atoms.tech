# WorkOS Email Configuration Guide

This guide explains how to configure WorkOS to send password reset emails and invitations using custom email providers (Resend).

## Problem Overview

By default, WorkOS uses its own email service to send transactional emails (password resets, invitations, magic auth codes, etc.). However, for production use, you should configure a custom email provider for better deliverability and branding.

### Issues Without Custom Email Configuration

1. **Password reset emails may not be sent** - WorkOS defaults may not be configured
2. **Poor email deliverability** - Default WorkOS emails may end up in spam
3. **Limited customization** - Cannot customize email templates or sender address
4. **No tracking** - Cannot track email delivery status

## Solution: Configure Resend as Custom Email Provider

### Step 1: Configure Custom Email Provider in WorkOS Dashboard

1. **Navigate to WorkOS Dashboard**
   - URL: https://dashboard.workos.com/
   - Login with your WorkOS account

2. **Go to Email Settings**
   - Click on "Emails" in the left sidebar
   - Click on "Providers" tab

3. **Enable Resend Provider**
   - Find "Resend" in the list of email providers
   - Click "Enable" or "Configure"
   - You'll need to provide:
     - **Resend API Key**: Get this from https://resend.com/api-keys
     - **From Email**: Must be a verified domain in Resend (e.g., `noreply@atoms.tech`)
     - **From Name**: Display name for the sender (e.g., "Atoms.Tech")

4. **Verify Domain in Resend**
   - Go to https://resend.com/domains
   - Add your domain (e.g., `atoms.tech`)
   - Add the required DNS records (SPF, DKIM, DMARC)
   - Wait for verification (usually 15-30 minutes)

### Step 2: Configure Redirect URLs in WorkOS Dashboard

For password reset and invitation emails to work correctly, you need to configure the redirect URLs.

1. **Navigate to Authentication Settings**
   - Go to: https://dashboard.workos.com/authentication
   - Click on "Redirects" tab

2. **Configure Password Reset URL**
   - Add a new redirect URL for password reset
   - **Development**: `http://localhost:3000/auth/reset-password?token={token}`
   - **Production**: `https://atoms.tech/auth/reset-password?token={token}`
   - The `{token}` placeholder will be replaced with the actual reset token

3. **Configure Invitation URL**
   - Add a new redirect URL for invitations
   - **Development**: `http://localhost:3000/accept-invitation?token={token}`
   - **Production**: `https://atoms.tech/accept-invitation?token={token}`
   - The `{token}` placeholder will be replaced with the actual invitation token

### Step 3: Disable Default WorkOS Emails (Optional)

If you want to handle email sending entirely through your custom provider:

1. **Navigate to Email Settings**
   - Go to: https://dashboard.workos.com/authentication
   - Click on "Emails" tab

2. **Configure Custom Emails**
   - Select "Configure emails"
   - Disable the default emails you want to customize:
     - Password Reset
     - Invitation
     - Magic Auth
     - Email Verification

3. **Handle Events via Webhooks** (Advanced)
   - Set up webhooks to listen for events:
     - `password_reset.created`
     - `invitation.created`
     - `magic_auth.created`
     - `email_verification.created`
   - When these events fire, fetch the sensitive data via API and send custom emails

### Step 4: Environment Variables Configuration

Ensure these environment variables are set in your `.env.local` and production (Vercel):

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@atoms.tech

# WorkOS Configuration
WORKOS_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_CLIENT_ID=client_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKOS_COOKIE_PASSWORD=your_secure_32_character_password_here
WORKOS_PASSWORD_RESET_URL=https://atoms.tech/auth/reset-password

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Verify Configuration

1. **Test Password Reset Flow**
   - Go to `/forgot-password` page
   - Enter a test email
   - Check that the email is received
   - Click the reset link and verify it works

2. **Test Signup Request Flow**
   - Go to `/signup-request` page
   - Submit a signup request
   - Check that the admin notification email is received
   - Check that the record is stored in the database

3. **Check Logs**
   - Check Vercel logs for any email sending errors
   - Check WorkOS dashboard for event logs
   - Check Resend dashboard for email delivery status

## Fallback Email Sending

The application includes a fallback mechanism for password reset emails:

1. **Primary**: WorkOS sends email via configured provider
2. **Fallback**: If WorkOS email fails, the app sends email directly via Resend

This ensures that password reset emails are always sent, even if WorkOS email sending is not configured.

### Code Implementation

See `src/app/(auth)/auth/actions.ts:242-355` for the password reset implementation with fallback:

```typescript
// Try WorkOS email sending first
try {
    passwordResetData = await workos.userManagement.createPasswordReset({ email });
} catch (workosError) {
    // Fallback: Send email directly via Resend
    const resend = new Resend(resendApiKey);
    const resetLink = `${resetUrl}?token=${passwordResetData.passwordResetToken}`;
    await resend.emails.send({ ... });
}
```

## Troubleshooting

### Issue: Password reset emails not received

**Possible Causes:**
1. WorkOS email provider not configured
2. Redirect URL not configured in WorkOS dashboard
3. Email going to spam folder
4. Resend domain not verified

**Solutions:**
1. Configure Resend as email provider in WorkOS dashboard
2. Add redirect URLs in WorkOS dashboard (Authentication → Redirects)
3. Add SPF/DKIM/DMARC records to your domain
4. Verify domain in Resend dashboard
5. Check Vercel logs for email sending errors

### Issue: Database error when creating signup request

**Possible Causes:**
1. Database migration not run
2. Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable
3. Row Level Security (RLS) policy misconfiguration

**Solutions:**
1. Run the database migration:
   ```bash
   curl -X POST http://localhost:3000/api/migrate \
     -H 'Authorization: Bearer YOUR_MIGRATION_SECRET_KEY' \
     -H 'Content-Type: application/json'
   ```
2. Verify environment variables are set:
   ```bash
   npm run verify-database
   ```
3. Check Supabase dashboard for RLS policies on `signup_requests` table

### Issue: WorkOS API errors

**Possible Causes:**
1. Using test API key in production
2. Missing or invalid `WORKOS_CLIENT_ID`
3. API key does not have required permissions

**Solutions:**
1. Use production API key (`sk_live_...`) in production environment
2. Verify `WORKOS_CLIENT_ID` matches the one in WorkOS dashboard
3. Check API key permissions in WorkOS dashboard

## Email Templates

### Password Reset Email Template

Located in `src/app/(auth)/auth/actions.ts:289-305`:

```html
<h2>Reset Your Password</h2>
<p>You requested to reset your password for your Atoms.Tech account.</p>
<p>Click the link below to create a new password:</p>
<p><a href="{resetLink}">Reset Password</a></p>
<p>This link will expire in 24 hours.</p>
```

### Signup Request Notification Email Template

Located in `src/app/(protected)/api/auth/signup-request/route.ts:120-127`:

```html
<h2>New Signup Request</h2>
<p><strong>Name:</strong> {fullName}</p>
<p><strong>Email:</strong> {email}</p>
<p><strong>Message:</strong> {message}</p>
<p><a href="{dashboardUrl}">View in Dashboard</a></p>
```

## Verification Commands

### 1. Verify Database Configuration

```bash
npx tsx scripts/verify-database.ts
```

This will:
- Check if `signup_requests` table exists
- Verify RLS policies are enabled
- Test insert/delete operations
- Show existing signup requests

### 2. Test Email Sending

```bash
# Test password reset email
curl -X POST http://localhost:3000/api/test-email \
  -H 'Content-Type: application/json' \
  -d '{"type": "password-reset", "email": "test@example.com"}'
```

### 3. Check Environment Variables

```bash
# List all required environment variables (values redacted)
npm run check-env
```

## Production Checklist

Before deploying to production, ensure:

- [ ] WorkOS production API key is set (`sk_live_...`)
- [ ] Resend API key is configured in WorkOS dashboard
- [ ] Domain is verified in Resend
- [ ] Password reset redirect URL is configured (production URL)
- [ ] Invitation redirect URL is configured (production URL)
- [ ] All environment variables are set in Vercel
- [ ] Database migration has been run
- [ ] Test password reset flow works
- [ ] Test signup request flow works
- [ ] Email delivery is monitored (Resend dashboard)

## Additional Resources

- [WorkOS Email Configuration Docs](https://workos.com/docs/authkit/custom-emails)
- [WorkOS Password Reset API](https://workos.com/docs/user-management/password-reset)
- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)

## Support

If you encounter issues:

1. Check Vercel logs for error messages
2. Check WorkOS dashboard event logs
3. Check Resend dashboard for email delivery status
4. Review this documentation
5. Contact support@atoms.tech for assistance
