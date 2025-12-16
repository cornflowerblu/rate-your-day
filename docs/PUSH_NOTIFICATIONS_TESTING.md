# Push Notifications Testing Guide

This guide explains how to test the push notification system for User Story 6 (Receive Daily Reminder).

## Overview

The push notification system consists of:

1. **Client-side**: Browser requests permission and subscribes to push notifications
2. **Backend API**: Stores push subscriptions in database
3. **Azure Function**: Timer trigger that sends notifications at 9 PM CST
4. **Service Worker**: Receives and displays notifications, handles clicks

## Prerequisites

### Environment Setup

1. **VAPID Keys** - Generate if you don't have them:

   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Environment Variables** - Add to `.env.local`:

   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
   VAPID_PRIVATE_KEY="your-private-key"
   VAPID_SUBJECT="mailto:your-email@example.com"
   ```

3. **Database** - Ensure Cosmos DB is running and `PushSubscription` model exists:
   ```bash
   npx prisma db push
   ```

### Browser Requirements

- **Chrome/Edge**: 111+ (full support)
- **Firefox**: 128+ (full support)
- **Safari**: 16.4+ (iOS requires Add to Home Screen)

**Important**: Safari on iOS only supports push notifications for installed PWAs (Add to Home Screen).

## Testing Workflow

### 1. Test Push Subscription (Client-side)

**Objective**: Verify browser can subscribe to push notifications

**Steps**:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open browser DevTools console

3. Test push support:

   ```javascript
   // Check if push is supported
   console.log('Push supported:', 'serviceWorker' in navigator && 'PushManager' in window)

   // Check notification permission
   console.log('Notification permission:', Notification.permission)
   ```

4. Import and test helper functions:

   ```javascript
   // Request permission
   const granted = await Notification.requestPermission()
   console.log('Permission:', granted) // Should be 'granted'

   // Subscribe to push
   const registration = await navigator.serviceWorker.ready
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: '<your-public-vapid-key-as-uint8array>',
   })
   console.log('Subscription:', subscription.toJSON())
   ```

**Expected Results**:

- Permission prompt appears
- User grants permission
- Subscription object is created with endpoint and keys

### 2. Test Subscribe API Endpoint

**Objective**: Verify subscription is saved to database

**Steps**:

1. Use the helper function (in browser console):

   ```javascript
   import { enablePushNotifications } from '@/lib/push'
   const success = await enablePushNotifications()
   console.log('Enabled:', success)
   ```

2. Or test API directly:

   ```bash
   # Get subscription from browser console
   const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
   console.log(JSON.stringify(sub.toJSON(), null, 2))

   # Then use curl (with session cookie)
   curl -X POST http://localhost:3000/api/push/subscribe \
     -H "Content-Type: application/json" \
     -d '{
       "endpoint": "https://...",
       "keys": {
         "p256dh": "...",
         "auth": "..."
       }
     }'
   ```

3. Verify in database:

   ```bash
   # Using Prisma Studio
   npx prisma studio

   # Or MongoDB client
   # Check PushSubscription collection
   ```

**Expected Results**:

- API returns 200 with success message
- Subscription appears in database with correct userId, endpoint, and keys

### 3. Test Notification Sending

**Option A: Use Test Endpoint (Recommended for Development)**

**Steps**:

1. Ensure you're authenticated and have a subscription saved

2. Call test endpoint:

   ```bash
   curl -X POST http://localhost:3000/api/push/test
   ```

   Or from browser console:

   ```javascript
   fetch('/api/push/test', { method: 'POST' })
     .then((r) => r.json())
     .then(console.log)
   ```

3. Check browser for notification

**Expected Results**:

- Notification appears in system tray
- Title: "Test Notification"
- Body: "This is a test push notification from Rate Your Day!"
- Icon displays correctly

**Option B: Use Azure Function Locally**

**Steps**:

1. Setup Azure Functions:

   ```bash
   cd azure-functions
   npm install
   cp local.settings.json.example local.settings.json
   # Edit local.settings.json with environment variables
   ```

2. Build TypeScript:

   ```bash
   npm run build
   ```

3. Modify timer schedule for testing (in `daily-reminder/function.json`):

   ```json
   {
     "schedule": "0 */1 * * * *" // Every 1 minute instead of daily
   }
   ```

4. Run Azure Functions locally:

   ```bash
   npm start
   ```

5. Wait for next minute (or trigger manually via HTTP if configured)

**Expected Results**:

- Function logs show execution
- If you haven't rated today, notification is sent
- If you have rated today, no notification (check logs)

### 4. Test Notification Click Handler

**Objective**: Verify clicking notification opens the app

**Steps**:

1. Send a test notification (using either method above)

2. When notification appears, click on it

**Expected Results**:

- If app is already open in a tab, that tab is focused and navigated to home
- If app is not open, new window/tab opens to home page (`/`)

**Implementation verified in**: `/public/sw.js` - `notificationclick` event listener

### 5. Test Unsubscribe

**Objective**: Verify user can unsubscribe from notifications

**Steps**:

1. From browser console:

   ```javascript
   import { disablePushNotifications } from '@/lib/push'
   const success = await disablePushNotifications()
   console.log('Disabled:', success)
   ```

2. Or call API directly:

   ```bash
   curl -X POST http://localhost:3000/api/push/unsubscribe
   ```

3. Verify in database - subscription should be removed

4. Verify in browser:
   ```javascript
   const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
   console.log('Subscription:', sub) // Should be null
   ```

**Expected Results**:

- API returns 200 success
- Subscription removed from database
- Browser subscription is unsubscribed

### 6. Test Production Timer Trigger

**Objective**: Verify scheduled notifications work in production

**Prerequisites**:

- Azure Function deployed to Azure
- Environment variables configured in Azure Portal
- At least one user with push subscription

**Steps**:

1. Deploy Azure Function:

   ```bash
   cd azure-functions
   func azure functionapp publish func-rate-your-day-reminder
   ```

2. Configure environment in Azure Portal:
   - Go to Function App > Configuration > Application Settings
   - Add: DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

3. Don't rate your day today

4. Wait until 9 PM CST (3 AM UTC next day)

5. Check for notification

6. Verify in Azure Portal:
   - Function App > Functions > daily-reminder > Monitor
   - Check invocation logs

**Expected Results**:

- Function executes at 9 PM CST
- Notification is sent
- Logs show "Notifications sent: 1"
- Clicking notification opens app

## Testing Checklist

Use this checklist to verify complete functionality:

- [ ] Browser supports push notifications
- [ ] Permission prompt appears
- [ ] User can grant permission
- [ ] Push subscription is created
- [ ] Subscription is saved to database
- [ ] Test notification can be sent successfully
- [ ] Notification appears in system tray
- [ ] Notification displays correct title, body, and icon
- [ ] Clicking notification opens app at correct URL
- [ ] Azure Function can run locally
- [ ] Azure Function checks if user rated today
- [ ] Azure Function sends notification only if not rated
- [ ] Azure Function handles invalid subscriptions (410 Gone)
- [ ] User can unsubscribe
- [ ] Unsubscribe removes from database and browser
- [ ] Production timer trigger runs at 9 PM CST

## Troubleshooting

### Notification Permission Denied

**Problem**: User denied permission

**Solution**:

1. Reset site permissions in browser settings
2. Chrome: `chrome://settings/content/notifications`
3. Remove site, revisit, and grant permission

### Subscription Fails

**Problem**: `registration.pushManager.subscribe()` throws error

**Possible Causes**:

1. VAPID public key is invalid or incorrect format
2. Service Worker not registered
3. HTTPS required (localhost is exempt)

**Solution**:

```javascript
// Verify service worker
const registration = await navigator.serviceWorker.ready
console.log('Service Worker ready:', registration)

// Check VAPID key
console.log('VAPID key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

// Ensure HTTPS (or localhost)
console.log('Is secure context:', window.isSecureContext)
```

### API Returns 401 Unauthorized

**Problem**: API endpoint returns 401

**Solution**:

- Ensure you're authenticated (signed in)
- Check session in browser DevTools > Application > Cookies
- Verify `next-auth` session is valid

### Notification Not Received

**Problem**: No notification appears after sending

**Possible Causes**:

1. Browser notifications blocked at OS level
2. Do Not Disturb mode enabled
3. Invalid subscription (expired)
4. VAPID keys mismatch (client vs server)

**Solution**:

1. Check OS notification settings (allow browser notifications)
2. Disable Do Not Disturb
3. Re-subscribe (unsubscribe + subscribe)
4. Verify VAPID keys match in both .env.local files

### Azure Function Not Triggering

**Problem**: Function doesn't run at scheduled time

**Solution**:

1. Check Function App is running (not stopped) in Azure Portal
2. Verify CRON expression in function.json: `0 0 3 * * *`
3. Check Application Insights logs for errors
4. Ensure timer trigger is enabled (not disabled)

### Invalid Subscription (410 Gone)

**Problem**: Push notification returns 410 Gone

**Explanation**: Subscription has expired or been revoked by push service

**Solution**:

- User needs to re-subscribe
- Azure Function automatically removes invalid subscriptions
- In the app, detect this and prompt user to re-enable notifications

## Manual Testing Commands

### Get Current Subscription

```javascript
const registration = await navigator.serviceWorker.ready
const subscription = await registration.pushManager.getSubscription()
console.log(subscription ? subscription.toJSON() : 'No subscription')
```

### Check Database

```bash
# Using Prisma Studio
npx prisma studio

# Or MongoDB shell
mongosh "your-connection-string"
use rate-your-day
db.PushSubscription.find().pretty()
```

### Send Test Notification (Development Only)

```bash
curl -X POST http://localhost:3000/api/push/test
```

### Check Notification Permission

```javascript
console.log('Permission:', Notification.permission)
// Values: 'default', 'granted', 'denied'
```

## Best Practices

1. **Always test in HTTPS** (production-like environment)
2. **Test on multiple browsers** (Chrome, Firefox, Safari)
3. **Test on mobile devices** (iOS requires PWA install)
4. **Verify error handling** (expired subscriptions, network errors)
5. **Check database cleanup** (invalid subscriptions removed)
6. **Monitor Azure logs** (verify function executes correctly)
7. **Test timezone handling** (ensure 9 PM CST works correctly)

## Production Deployment Checklist

Before deploying to production:

- [ ] VAPID keys generated and stored securely
- [ ] Environment variables configured in Vercel (Next.js app)
- [ ] Environment variables configured in Azure (Functions)
- [ ] Azure Function deployed and tested
- [ ] Timer schedule verified (9 PM CST = 3 AM UTC)
- [ ] Service Worker deployed and active
- [ ] Database schema includes PushSubscription model
- [ ] Notification click handler tested
- [ ] Unsubscribe flow tested
- [ ] Invalid subscription cleanup tested
- [ ] Push notification appears on all target browsers
- [ ] PWA installed and notifications work (iOS Safari)

## Additional Resources

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Azure Functions Timer Trigger](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push library](https://github.com/web-push-libs/web-push)
