# Clerk Token Configuration for CADZERO Add-in

## Issue
The add-in requires frequent re-authentication because Clerk's default session tokens expire after 60 seconds.

## Solution: Extend Token Lifetime in Clerk Dashboard

Follow these steps to extend your session token lifetime:

### 1. Adjust Session Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Sessions** → **Settings**
3. Configure these settings:
   - **Session inactivity timeout**: `7 days` (or your preferred duration)
   - **Session maximum lifetime**: `30 days` (or your preferred duration)
   
   These settings control how long a session remains valid.

### 2. Extend JWT Token Lifetime

1. In the Clerk Dashboard, navigate to **JWT Templates**
2. Select your **Default** template (or create a custom one)
3. Find the **Token lifetime** setting
4. Increase it to a longer duration:
   - **Recommended**: `10-15 minutes` (good balance of security and UX)
   - **Maximum**: `1 hour` (if you need longer-lived tokens)
   
   ⚠️ **Security Note**: Longer token lifetimes are less secure. For a desktop add-in, 10-15 minutes is a good compromise.

### 3. Apply Changes

1. Click **Save** on your JWT template
2. The changes take effect immediately for new logins

## What Changed in the Code

I've also updated your code to track `session_id` for future token refresh implementation:

### Frontend Changes (`cadzero.auth-callback.tsx`)
- Now passes `session_id` along with the token to the add-in
- This allows the add-in to validate sessions in the future

### Backend Changes (`auth.go`)
- Added a `/api/auth/refresh` endpoint for session validation
- Currently returns an error prompting re-authentication (since Clerk's Go SDK doesn't support server-side token generation for client sessions)

### Add-in Changes (`auth.py`)
- Enhanced `AuthToken` class to store `session_id` and `token_expiry`
- Added `refresh_token()` method (currently calls backend, but won't get new tokens until Dashboard settings are updated)
- `get_auth_header()` now automatically checks token expiry

## Recommended Approach

**Option 1: Dashboard Configuration (Recommended)**
- Extend token lifetime to 10-15 minutes via Clerk Dashboard
- No additional code changes needed
- Simplest and most secure approach

**Option 2: Manual Re-authentication**
- Keep short token lifetimes (60 seconds)
- Users manually re-authenticate when tokens expire
- Most secure but worst UX

**Option 3: Future Enhancement - Refresh Tokens**
- Would require implementing OAuth2 refresh token flow
- More complex but provides better security with good UX
- Not currently supported by Clerk's standard JWT flow

## Testing

After making the Dashboard changes:

1. Clear any existing tokens in your add-in:
   - Delete `/addins/CADZERO/.auth_token.json`
2. Restart Fusion 360
3. Re-authenticate through the add-in
4. You should now stay logged in for the duration you configured (10-15 minutes)

## Additional Resources

- [Clerk Session Tokens Documentation](https://clerk.com/docs/session-tokens)
- [Clerk Session Options](https://clerk.com/docs/guides/secure/session-options)
- [JWT Template Customization](https://clerk.com/docs/backend-requests/making/jwt-templates)

