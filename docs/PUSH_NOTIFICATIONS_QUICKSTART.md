# Push Notifications Quick Start Guide

Get push notifications working in 5 minutes.

## Prerequisites

- Next.js app running (`npm run dev`)
- Database connected (Cosmos DB with PushSubscription model)
- HTTPS or localhost (required for Service Worker)

## Step 1: Generate VAPID Keys (30 seconds)

```bash
npx web-push generate-vapid-keys
```

Copy the output. You'll use these keys everywhere.

## Step 2: Configure Environment (1 minute)

Add to `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key-here"
VAPID_PRIVATE_KEY="your-private-key-here"
VAPID_SUBJECT="mailto:your-email@example.com"
```

**Restart dev server**:

```bash
npm run dev
```

## Step 3: Enable Notifications (1 minute)

Open browser console and run:

```javascript
// Import helper
import { enablePushNotifications } from '@/lib/push'

// Enable notifications (requests permission + subscribes + saves to DB)
const success = await enablePushNotifications()
console.log('Notifications enabled:', success)
```

You should see:

1. Browser permission prompt
2. Click "Allow"
3. Console shows `true`

## Step 4: Send Test Notification (30 seconds)

In browser console or terminal:

```javascript
// Browser console:
fetch('/api/push/test', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

// Or curl:
curl -X POST http://localhost:3000/api/push/test
```

**Expected**: Notification appears in system tray

## Step 5: Verify Database (30 seconds)

```bash
npx prisma studio
```

Navigate to `PushSubscription` table. You should see one record with:

- Your email as `userId`
- Push endpoint URL
- Keys (p256dh, auth)

## Troubleshooting

### Permission Denied

**Reset site permissions**:

- Chrome: `chrome://settings/content/notifications`
- Remove localhost, revisit, and re-run Step 3

### No Notification Appeared

**Check**:

1. Browser notifications enabled at OS level
2. Do Not Disturb disabled
3. Test endpoint returned 200 (check console)

**Debug**:

```javascript
// Check subscription exists
const reg = await navigator.serviceWorker.ready
const sub = await reg.pushManager.getSubscription()
console.log('Subscription:', sub?.toJSON())
```

### 401 Unauthorized

**Ensure you're signed in**:

- Visit app homepage
- Sign in with Microsoft account
- Retry from Step 3

## Next Steps

### Test Azure Function Locally

```bash
cd azure-functions
npm install
cp local.settings.json.example local.settings.json
# Edit local.settings.json with same VAPID keys and DATABASE_URL
npm run build
npm start
```

Modify schedule in `function.json` for testing:

```json
"schedule": "0 */1 * * * *"  // Every 1 minute
```

### Add UI Toggle (Future)

Create a component to enable/disable notifications:

```typescript
import { enablePushNotifications, disablePushNotifications } from '@/lib/push'

function NotificationToggle() {
  const [enabled, setEnabled] = useState(false)

  const handleToggle = async () => {
    if (enabled) {
      await disablePushNotifications()
      setEnabled(false)
    } else {
      const success = await enablePushNotifications()
      setEnabled(success)
    }
  }

  return (
    <button onClick={handleToggle}>
      {enabled ? 'Disable' : 'Enable'} Notifications
    </button>
  )
}
```

## API Reference

### Client Functions

```typescript
// All-in-one enable
enablePushNotifications(): Promise<boolean>

// All-in-one disable
disablePushNotifications(): Promise<boolean>

// Individual steps
requestNotificationPermission(): Promise<boolean>
subscribeToPush(): Promise<PushSubscription | null>
savePushSubscription(sub: PushSubscription): Promise<boolean>
```

### API Endpoints

```bash
# Subscribe (save to DB)
POST /api/push/subscribe
Body: { endpoint, keys: { p256dh, auth } }

# Unsubscribe (remove from DB)
POST /api/push/unsubscribe

# Test notification (dev only)
POST /api/push/test
```

## Production Deployment

1. **Add VAPID keys to Vercel**:
   - Settings > Environment Variables
   - Add all three variables
   - Redeploy

2. **Deploy Azure Function**:

   ```bash
   cd azure-functions
   func azure functionapp publish func-rate-your-day-reminder
   ```

3. **Add VAPID keys to Azure Portal**:
   - Function App > Configuration > Application Settings
   - Add all four variables (including DATABASE_URL)

4. **Test at 9 PM CST** (3 AM UTC):
   - Don't rate your day
   - Wait for notification
   - Check Azure Portal > Monitor for execution logs

## Full Documentation

- **Testing Guide**: `docs/PUSH_NOTIFICATIONS_TESTING.md`
- **Environment Setup**: `docs/ENVIRONMENT_SETUP_PUSH.md`
- **Implementation Summary**: `docs/US6_IMPLEMENTATION_SUMMARY.md`
- **Azure Function README**: `azure-functions/README.md`

## Success Criteria

- [x] VAPID keys generated
- [x] Environment variables configured
- [x] Browser permission granted
- [x] Subscription saved to database
- [x] Test notification received
- [x] Notification click opens app

**Total time**: ~5 minutes

You're done! 🎉
