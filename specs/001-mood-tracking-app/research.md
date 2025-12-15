# Research: Mood Tracking Application

**Date**: 2025-12-15
**Status**: Complete
**Related**: [plan.md](./plan.md), [ADR 001](../../docs/adr/001-framework-selection.md), [ADR 002](../../docs/adr/002-infrastructure.md)

## Overview

This document consolidates research findings for technology choices and implementation patterns. Most architectural decisions are documented in existing ADRs; this research focuses on library-level choices and implementation patterns.

## 1. Calendar Component Library

**Decision**: Use `date-fns` for date manipulation + custom React calendar component

**Rationale**:
- **date-fns** (2.30.0+): Lightweight, tree-shakeable, excellent TypeScript support
- **Custom calendar**: Spec requires specific layout (Sunday-Saturday, emoji rendering, disabled future dates)
- **react-calendar** considered but adds 88KB and we only need a simple month grid

**Implementation Pattern**:
```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';

// Generate days array for calendar grid
const days = eachDayOfInterval({
  start: startOfMonth(currentMonth),
  end: endOfMonth(currentMonth)
});
```

**Alternatives Considered**:
- **react-calendar**: Full-featured but overkill, harder to customize emoji rendering
- **react-day-picker**: Modern but requires more customization than building from scratch
- **Bare HTML table**: Considered, but date-fns provides robust date handling

## 2. PWA Implementation with Next.js 16

**Decision**: Use `next-pwa` v5.6.0+ with Workbox

**Rationale**:
- Official Next.js PWA plugin
- Zero-config for basic PWA features
- Workbox strategies for caching (NetworkFirst for API, CacheFirst for assets)
- Supports background sync for offline changes

**Implementation**:
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.vercel\.app\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
});
```

**Manifest Configuration**:
```typescript
// src/app/manifest.ts (Next.js 16 App Router)
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rate Your Day',
    short_name: 'RateDay',
    description: 'Track your daily mood',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
}
```

**Alternatives Considered**:
- **Custom Service Worker**: More control but harder to maintain, Workbox provides battle-tested strategies
- **vite-plugin-pwa**: Not compatible with Next.js

## 3. Push Notifications with Web Push API

**Decision**: Use `web-push` library (3.6.0+) with VAPID keys

**Rationale**:
- Industry standard for Web Push API
- Handles VAPID authentication
- Works with all major browsers (Chrome, Firefox, Safari 16.4+)
- Azure Functions can use same library for server-side sending

**Implementation Pattern**:
```typescript
// Client-side subscription (src/lib/push.ts)
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  });

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
}

// Server-side sending (azure-functions/daily-reminder/index.ts)
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:example@domain.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'Rate Your Day',
  body: "Don't forget to rate your day!",
  icon: '/icons/icon-192x192.png',
  badge: '/icons/badge-72x72.png',
  data: { url: '/' }
}));
```

**Security Notes**:
- VAPID keys generated once, stored in environment variables
- Public key: Client-side (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
- Private key: Server-side only (VAPID_PRIVATE_KEY in Azure Functions)

**Alternatives Considered**:
- **Firebase Cloud Messaging**: Overkill, adds Google dependency
- **OneSignal**: Third-party service, unnecessary cost

## 4. Authentication with NextAuth.js + Azure AD

**Decision**: Use NextAuth.js v5 (Auth.js) with AzureADProvider

**Rationale**:
- Official Next.js authentication library
- Native Azure AD provider
- Handles OAuth 2.0 flow, tokens, sessions
- Works with App Router (route.ts pattern)

**Implementation**:
```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow only specific user (owner)
      const allowedEmail = process.env.OWNER_EMAIL;
      return user.email === allowedEmail;
    }
  },
  session: { strategy: 'jwt' }
});

// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/lib/auth';
```

**Session Protection**:
```typescript
// Middleware to protect all routes
import { auth } from '@/lib/auth';

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== '/api/auth/signin') {
    return Response.redirect(new URL('/api/auth/signin', req.url));
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)']
};
```

**Alternatives Considered**:
- **Clerk**: Third-party, unnecessary cost
- **Custom OAuth**: More work, NextAuth.js handles edge cases

## 5. Prisma with Cosmos DB MongoDB API

**Decision**: Use Prisma 7 with MongoDB provider, awareness of Cosmos DB quirks

**Rationale**:
- ADR 002 establishes Cosmos DB with MongoDB API
- Prisma 7 is Rust-free, TypeScript-based (faster, smaller)
- MongoDB provider works with Cosmos DB

**Known Quirks** (from Cosmos DB MongoDB API):
- `@unique` on string fields may have case-sensitivity issues
- Use lowercase ISO dates (YYYY-MM-DD) for date field
- Transactions require specific configuration
- `updatedAt` works but may have slight latency

**Schema** (from ADR 002):
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model DayRating {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      String   @unique  // YYYY-MM-DD format, lowercase
  rating    Int      // 1=angry, 2=sad, 3=average, 4=happy
  notes     String?  // optional, max 280 chars (validated in app)
  userId    String   // owner's email from Entra ID
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, date])  // Query by user + date
}

model PushSubscription {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @unique  // one subscription per user
  endpoint     String
  keys         Json     // { p256dh, auth }
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Initialization**:
```bash
npx prisma generate
npx prisma db push  # No migrations for MongoDB
```

**Alternatives Considered**:
- **Mongoose**: Less type-safe than Prisma
- **MongoDB native driver**: More boilerplate

## 6. Azure Functions Timer Trigger

**Decision**: Use Timer Trigger with cron expression `0 0 21 * * *` (9 PM UTC, adjusted for CST)

**Rationale**:
- Built-in scheduler, no external service needed
- Free tier covers our usage (1 execution/day)
- Node.js 20 runtime matches main app

**Implementation**:
```json
// azure-functions/daily-reminder/function.json
{
  "bindings": [
    {
      "name": "myTimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 2 * * *"  // 2 AM UTC = 9 PM CST (UTC-6)
    }
  ]
}
```

```typescript
// azure-functions/daily-reminder/index.ts
import { AzureFunction, Context } from '@azure/functions';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const prisma = new PrismaClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Find users who haven't rated today
  const allSubscriptions = await prisma.pushSubscription.findMany();

  for (const sub of allSubscriptions) {
    const rating = await prisma.dayRating.findUnique({
      where: { userId_date: { userId: sub.userId, date: today } }
    });

    if (!rating) {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({
          title: 'Rate Your Day',
          body: "You haven't rated today yet!",
          icon: '/icons/icon-192x192.png'
        })
      );
    }
  }
};

export default timerTrigger;
```

**Deployment**:
```bash
cd azure-functions
func azure functionapp publish func-rate-your-day-reminder
```

**Alternatives Considered**:
- **Vercel Cron Jobs**: Limited to Pro plan, less flexible
- **GitHub Actions**: Requires wake-up mechanism, less reliable

## 7. Offline Sync Pattern

**Decision**: Use IndexedDB via `idb` library + Background Sync API

**Rationale**:
- IndexedDB provides structured offline storage
- Background Sync automatically syncs when online
- `idb` library wraps IndexedDB with Promises

**Implementation**:
```typescript
// src/lib/offline-db.ts
import { openDB } from 'idb';

const dbPromise = openDB('rate-your-day', 1, {
  upgrade(db) {
    db.createObjectStore('pending-ratings', { keyPath: 'date' });
  }
});

export async function savePendingRating(date: string, rating: number, notes?: string) {
  const db = await dbPromise;
  await db.put('pending-ratings', { date, rating, notes, timestamp: Date.now() });

  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in self.registration) {
    await self.registration.sync.register('sync-ratings');
  }
}

// Service Worker (public/sw.js)
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncPendingRatings());
  }
});

async function syncPendingRatings() {
  const db = await openDB('rate-your-day', 1);
  const pending = await db.getAll('pending-ratings');

  for (const item of pending) {
    try {
      await fetch('/api/ratings/' + item.date, {
        method: 'POST',
        body: JSON.stringify({ rating: item.rating, notes: item.notes }),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pending-ratings', item.date);
    } catch (err) {
      // Will retry on next sync
    }
  }
}
```

**Alternatives Considered**:
- **LocalStorage**: Too limited (5MB, string-only)
- **Custom sync logic**: Background Sync API handles retry

## 8. Debounced Auto-Save Pattern

**Decision**: Use `useDebouncedCallback` from `use-debounce` library

**Rationale**:
- Prevents excessive API calls during typing
- 1-second delay matches spec requirement
- Handles React re-renders correctly

**Implementation**:
```typescript
import { useDebouncedCallback } from 'use-debounce';

function NotesInput({ date, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes);

  const debouncedSave = useDebouncedCallback(
    async (value: string) => {
      await fetch(`/api/ratings/${date}`, {
        method: 'POST',
        body: JSON.stringify({ notes: value }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    1000  // 1 second delay
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 280);  // Enforce limit
    setNotes(value);
    debouncedSave(value);
  };

  return (
    <textarea value={notes} onChange={handleChange} maxLength={280} />
  );
}
```

**Alternatives Considered**:
- **lodash.debounce**: Larger bundle, use-debounce is React-optimized
- **Custom debounce**: More code, library handles edge cases

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Calendar | date-fns + custom component | Lightweight, full control over rendering |
| PWA | next-pwa with Workbox | Zero-config, battle-tested caching strategies |
| Push Notifications | web-push library | Industry standard, VAPID support |
| Authentication | NextAuth.js v5 + Azure AD | Native Azure provider, handles OAuth flow |
| Database | Prisma 7 + Cosmos DB MongoDB API | Per ADR 002, type-safe, works with Cosmos quirks |
| Scheduler | Azure Functions Timer Trigger | Built-in, free tier, reliable |
| Offline Sync | IndexedDB (idb) + Background Sync | Structured storage, automatic retry |
| Auto-Save | use-debounce | React-optimized, prevents excessive API calls |

All decisions align with ADR 001 (Next.js) and ADR 002 (Vercel + Azure). No new ADRs required.
