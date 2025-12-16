# Push Notifications Environment Setup

Quick reference guide for setting up push notification environment variables.

## Generate VAPID Keys

Run this command once to generate your VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Example output:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib27SX5nX06ywBXnK0ZQ-5wHjJFhqJx3N6eJV5fV9Qj6Q3fhXd3yKU9Wf2s

Private Key:
bdSiCo1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c

=======================================
```

**IMPORTANT**: Generate these keys ONCE and use the same keys everywhere. Do not generate different keys for development and production.

## Next.js Application (.env.local)

Add these to your `.env.local` file:

```env
# Push Notifications (VAPID)
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BEl62iUYgUivxIkv69yViEuiBIa-Ib27SX5nX06ywBXnK0ZQ-5wHjJFhqJx3N6eJV5fV9Qj6Q3fhXd3yKU9Wf2s"
VAPID_PRIVATE_KEY="bdSiCo1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c"
VAPID_SUBJECT="mailto:your-email@example.com"
```

**Variables**:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public VAPID key (exposed to client)
- `VAPID_PRIVATE_KEY` - Private VAPID key (server-side only, used for test endpoint)
- `VAPID_SUBJECT` - Your contact email (mailto:) or website URL

## Azure Functions (local.settings.json)

For local development, create `azure-functions/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATABASE_URL": "mongodb+srv://your-cosmos-db-connection-string",
    "VAPID_PUBLIC_KEY": "BEl62iUYgUivxIkv69yViEuiBIa-Ib27SX5nX06ywBXnK0ZQ-5wHjJFhqJx3N6eJV5fV9Qj6Q3fhXd3yKU9Wf2s",
    "VAPID_PRIVATE_KEY": "bdSiCo1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c",
    "VAPID_SUBJECT": "mailto:your-email@example.com"
  }
}
```

**Variables**:

- `DATABASE_URL` - Same as main app (Cosmos DB connection string)
- `VAPID_PUBLIC_KEY` - Same public key as main app (no `NEXT_PUBLIC_` prefix)
- `VAPID_PRIVATE_KEY` - Same private key as main app
- `VAPID_SUBJECT` - Same subject as main app

## Vercel (Production - Next.js)

Add these environment variables in Vercel Dashboard:

1. Go to your project in Vercel
2. Navigate to Settings > Environment Variables
3. Add the following:

| Name                           | Value                           | Environment                      |
| ------------------------------ | ------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Your public key                 | Production, Preview, Development |
| `VAPID_PRIVATE_KEY`            | Your private key                | Production, Preview, Development |
| `VAPID_SUBJECT`                | `mailto:your-email@example.com` | Production, Preview, Development |

**Important**:

- Check all three environments (Production, Preview, Development)
- These will be available in your next deployment

## Azure Portal (Production - Functions)

Add these in Azure Portal:

1. Navigate to your Function App
2. Go to Configuration > Application Settings
3. Add the following:

| Name                | Value                            |
| ------------------- | -------------------------------- |
| `DATABASE_URL`      | Your Cosmos DB connection string |
| `VAPID_PUBLIC_KEY`  | Your public key                  |
| `VAPID_PRIVATE_KEY` | Your private key                 |
| `VAPID_SUBJECT`     | `mailto:your-email@example.com`  |

**Steps**:

1. Click "+ New application setting"
2. Enter Name and Value
3. Click OK
4. Click Save (at the top)
5. Confirm restart when prompted

## Verification

### Check Next.js App

```bash
# Start dev server
npm run dev

# In browser console:
console.log('Public VAPID:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
# Should print your public key
```

### Check Azure Functions (Local)

```bash
cd azure-functions
npm start

# Function logs should not show "VAPID environment variables not configured"
```

### Check Azure Functions (Production)

1. Go to Function App > Configuration > Application Settings
2. Verify all four variables are present
3. Go to Functions > daily-reminder > Monitor
4. Check recent executions for VAPID-related errors

## Common Issues

### Issue: "VAPID public key not configured"

**Cause**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` not set or not prefixed correctly

**Solution**:

- Ensure variable name has `NEXT_PUBLIC_` prefix
- Restart dev server after adding to `.env.local`
- In production, redeploy after adding to Vercel

### Issue: "Invalid VAPID key"

**Cause**: Key is malformed or copied incorrectly

**Solution**:

- Copy the entire key including all characters
- No quotes or spaces
- Keys are base64url encoded, should not contain `+` or `/`

### Issue: "Push subscription failed"

**Cause**: Public key mismatch between client and server

**Solution**:

- Ensure same public key in both `.env.local` and `local.settings.json`
- Clear browser cache and service worker
- Re-subscribe

### Issue: Azure Function "VAPID environment variables not configured"

**Cause**: Variables not set in Azure Portal

**Solution**:

1. Check Function App > Configuration
2. Add all four required variables
3. Save and restart Function App

## Security Checklist

- [ ] VAPID keys generated and saved securely
- [ ] `.env.local` file is in `.gitignore` (never commit)
- [ ] `local.settings.json` is in `.gitignore` (never commit)
- [ ] Same keys used across all environments
- [ ] Private key only accessible server-side (not in `NEXT_PUBLIC_*`)
- [ ] VAPID subject is a valid email or URL
- [ ] Keys rotated if compromised

## Key Rotation (If Needed)

If your VAPID keys are compromised:

1. Generate new keys: `npx web-push generate-vapid-keys`
2. Update in all locations:
   - Next.js `.env.local`
   - Vercel environment variables
   - Azure Functions `local.settings.json`
   - Azure Portal Function App settings
3. All users must re-subscribe (old subscriptions invalid)
4. Consider notifying users via in-app message

## Quick Setup Script

For initial setup, you can use this script:

```bash
#!/bin/bash

# Generate VAPID keys
echo "Generating VAPID keys..."
npx web-push generate-vapid-keys > vapid-keys.txt

echo ""
echo "VAPID keys saved to vapid-keys.txt"
echo ""
echo "Next steps:"
echo "1. Copy public key to NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local"
echo "2. Copy private key to VAPID_PRIVATE_KEY in .env.local"
echo "3. Set VAPID_SUBJECT to mailto:your-email@example.com"
echo "4. Copy same keys to azure-functions/local.settings.json"
echo "5. Add to Vercel environment variables (production)"
echo "6. Add to Azure Portal Function App settings (production)"
echo ""
echo "⚠️  IMPORTANT: Delete vapid-keys.txt after copying keys"
echo "⚠️  Store keys securely (password manager, encrypted vault)"
```

Save as `setup-vapid.sh`, make executable (`chmod +x setup-vapid.sh`), and run.

## References

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [web-push Library Documentation](https://github.com/web-push-libs/web-push)
