# Email Setup Guide for User Registration

## Current Status
- User registration verification emails are implemented and ready
- System automatically sends verification emails when users sign up
- Issue: SendGrid API key is returning "Unauthorized" errors

## Quick Fix Steps

### 1. Generate New SendGrid API Key
1. Go to https://app.sendgrid.com/settings/api_keys
2. Click "Create API Key"
3. Name it "CoachAI-Registration"
4. Select "Full Access" permissions
5. Copy the new key (starts with "SG.")

### 2. Verify Sender Domain
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Authenticate Your Domain"
3. Add your domain (e.g., coachai.app)
4. Follow DNS setup instructions
5. Wait for verification (can take up to 48 hours)

### 3. Alternative: Single Sender Verification
If you don't have a domain to verify:
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Click "Create Single Sender"
3. Use an email you control (e.g., admin@yourdomain.com)
4. Complete verification via email

### 4. Update Configuration
Once you have a verified sender:
1. Set the FROM_EMAIL environment variable to your verified email
2. Update the SENDGRID_API_KEY with the new key

## What Users Get When Registration Emails Work

### Verification Email Includes:
- Welcome message to CoachAI Platform
- Click-to-verify account link
- Professional branding
- Instructions for next steps

### Email Template:
```
Subject: Verify Your CoachAI Account

Hi [username],

Welcome to CoachAI! Please verify your email address to activate your account.

[VERIFY ACCOUNT BUTTON]

If the button doesn't work, copy this link:
[verification_url]

Best regards,
CoachAI Team
```

## Current Fallback Behavior
When emails fail to send:
- Users are still registered successfully
- Manual verification URL is provided in console logs
- System continues to function normally
- Admin can manually verify accounts if needed

## Testing
Run this command to test email delivery:
```bash
npx tsx scripts/test-verification-email.ts
```

## Support
If you continue having issues:
1. Check SendGrid account status
2. Verify API key permissions
3. Confirm sender authentication
4. Contact SendGrid support if needed