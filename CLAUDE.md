# CLAUDE.md - Project Guide for rate-your-day

## Important: This is a Speckit Project

**CRITICAL: Always consult existing specifications before starting any work.**

This project uses the [Speckit framework](https://github.com/github/spec-kit) for structured feature development. Before implementing any feature or making architecture decisions:

1. **Check `specs/` directory** for existing feature specifications
2. **Check `docs/adr/` directory** for Architecture Decision Records:
   - [ADR 001: Framework Selection](docs/adr/001-framework-selection.md) - Next.js 16+ with App Router
   - [ADR 002: Infrastructure](docs/adr/002-infrastructure.md) - Vercel + Azure Cosmos DB + Azure Functions
3. **Follow the speckit workflow**:
   - `/speckit.specify` - Create feature specification (WHAT and WHY)
   - `/speckit.plan` - Generate implementation plan (HOW)
   - `/speckit.tasks` - Break down into tasks
   - `/speckit.implement` - Execute implementation

**Never contradict existing ADRs or specs without explicit user approval and documentation updates.**

## Important: Documentation Lookup

**Always consult the Context7 MCP server for the latest documentation** when working with any technology in this stack. This ensures you're using current APIs, best practices, and avoiding deprecated patterns.

```
# Example: Before implementing Next.js features
Use context7 to fetch latest Next.js docs for App Router, Server Components, etc.

# Example: Before writing Prisma queries
Use context7 to verify current Prisma syntax and features
```

## Project Overview

Rate Your Day is a mood tracking application where users rate their daily experience using an emoji-based scale. The app displays the current day's rating selection and provides a calendar view showing historical ratings across the month, with optional notes for each entry.

## Tech Stack

- **Framework**: Next.js 16 (App Router) - uses Turbopack, React 19.2
- **Language**: TypeScript 5.1+
- **Styling**: Tailwind CSS 4.0
- **Database**: Azure Cosmos DB (MongoDB API) - serverless, pay-per-request
- **Authentication**: Microsoft Entra ID (SSO)
- **PWA**: Service Worker, Web Push API, Background Sync
- **Hosting**: Vercel (Pro)
- **Scheduler**: Azure Functions (for 9PM reminder)
- **ORM**: Prisma 7 (with MongoDB provider)
- **Node.js**: 20.9.0+ (required for Next.js 16)

### Version Requirements

| Package | Minimum Version | Notes |
|---------|-----------------|-------|
| Node.js | 20.9.0 | Node 18 no longer supported |
| Next.js | 16.x | Turbopack is now default |
| React | 19.2 | View Transitions, useEffectEvent |
| TypeScript | 5.1.0 | Required by Next.js 16 |
| Tailwind CSS | 4.0 | CSS-first config, 5x faster builds |
| Prisma | 7.x | Rust-free, TypeScript-based |

### Why Next.js over Flask?

- Single codebase for frontend + API (faster development)
- Built-in responsive design patterns with React
- Excellent TypeScript support
- Simpler deployment pipeline
- Rich ecosystem for calendar/date components

### Why Vercel + Cosmos DB?

- **Vercel**: First-party Next.js support, Pro account available
- **Cosmos DB MongoDB API**: Serverless pay-per-request + Prisma compatibility
- **Cost**: Near-zero for single-user low-traffic app

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (uses Turbopack by default in Next.js 16)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Database - push schema to Cosmos DB (MongoDB doesn't use migrations)
npx prisma db push
npx prisma generate
```

## Project Structure

```
rate-your-day/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Home - today's rating + calendar
│   │   ├── layout.tsx       # Root layout
│   │   ├── manifest.ts      # PWA Web App Manifest
│   │   └── api/             # API routes (Vercel serverless functions)
│   │       ├── ratings/     # Rating CRUD endpoints
│   │       └── push/        # Push notification endpoints
│   ├── components/
│   │   ├── MoodSelector.tsx # Emoji rating selector
│   │   ├── Calendar.tsx     # Monthly calendar view
│   │   ├── DayCell.tsx      # Individual calendar day
│   │   ├── NotesInput.tsx   # Notes text field
│   │   └── OfflineIndicator.tsx
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── types.ts         # TypeScript types
│   │   └── push.ts          # Push notification helpers
│   └── styles/
│       └── globals.css      # Global styles + Tailwind
├── prisma/
│   └── schema.prisma        # Database schema (MongoDB provider)
├── public/
│   ├── icons/               # App icons (PWA)
│   ├── sw.js                # Service Worker
│   └── offline.html         # Offline fallback page
├── azure-functions/         # Azure Functions (notification scheduler)
│   └── daily-reminder/
├── tests/
├── package.json
└── tailwind.config.ts       # Note: Tailwind 4 uses CSS-first config
```

## Core Features

### 1. Mood Rating Selector
- Four emoji faces displayed horizontally (left to right):
  - 😠 Angry (value: 1)
  - 😢 Sad (value: 2)
  - 😐 Average (value: 3)
  - 😊 Happy (value: 4)
- Tappable/clickable with visual feedback on selection
- Shows current selection state clearly

### 2. Today's View
- Prominently displays today's date
- Shows current rating selection (or prompt to rate if not yet rated)
- Notes input field below rating

### 3. Calendar View
- Monthly grid showing all days
- Each day cell displays the mood emoji for that day
- Empty/neutral state for unrated days
- Navigate between months
- Tap day to view/edit that day's rating and notes

### 4. Notes Feature
- Small text input field (max 280 characters)
- Associated with each day's rating
- Optional - rating can be saved without notes

### 5. PWA & Offline Support
- Installable as app on mobile and desktop
- Works offline with cached data
- Background sync when connection restored
- Service Worker caches app shell and API responses

### 6. Daily Reminder
- Push notification at 9PM CST if day not rated
- Requires user permission grant
- Server-side scheduling via Azure Functions (Timer Trigger)
- Tapping notification opens today's rating view

## Authentication

### Current: Microsoft Entra ID (Single User)
- SSO with Microsoft account via Entra ID (formerly Azure AD)
- Single authorized user (owner only)
- Uses `next-auth` with Azure AD provider
- Protects all routes - must be authenticated to access app

### Future: Firebase Auth (Public Users)
If the app needs to support public user registration:
- Switch to Firebase Authentication
- Supports email/password, Google, GitHub, etc.
- User data isolation per account
- See `docs/adr/003-authentication.md` for migration path (to be created)

### Auth Flow
```
User visits app
    → Redirected to Microsoft login
    → Entra ID validates credentials
    → Returns to app with session
    → All API routes check session
```

## Data Model

### Prisma Schema (MongoDB)
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model DayRating {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      String   @unique  // ISO date (YYYY-MM-DD)
  rating    Int      // 1=angry, 2=sad, 3=average, 4=happy
  notes     String?  // optional, max 280 chars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ratings?month=YYYY-MM` | Get all ratings for a month |
| GET | `/api/ratings/:date` | Get rating for specific date |
| POST | `/api/ratings` | Create/update rating for a date |
| DELETE | `/api/ratings/:date` | Delete rating for a date |

## UI/UX Requirements

- **Responsive**: Must work identically on mobile and desktop
- **Mobile-first**: Design for touch interactions first
- **Accessible**: Proper ARIA labels, keyboard navigation
- **Fast**: Immediate visual feedback on interactions
- **Simple**: Minimal UI, focus on core functionality

## Code Style Guidelines

- Use TypeScript strict mode
- Follow ESLint + Prettier configuration
- React components as functional components with hooks
- Use server components where possible (Next.js App Router)
- Write tests for API routes and critical components

## Environment Variables

```bash
# Database (Cosmos DB MongoDB connection string)
DATABASE_URL=              # mongodb+srv://...

# App
NEXT_PUBLIC_APP_URL=       # Public app URL (Vercel URL)
NEXTAUTH_URL=              # NextAuth callback URL (same as app URL)
NEXTAUTH_SECRET=           # Random secret for session encryption

# Microsoft Entra ID
AZURE_AD_CLIENT_ID=        # App registration client ID
AZURE_AD_CLIENT_SECRET=    # App registration client secret
AZURE_AD_TENANT_ID=        # Azure tenant ID (or 'common' for multi-tenant)

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Public VAPID key (client-side)
VAPID_PRIVATE_KEY=              # Private VAPID key (server-side only)
VAPID_SUBJECT=                  # mailto: or URL for VAPID
```

## Deployment

### Architecture
```
┌─────────────────┐     ┌──────────────────────────┐
│     Vercel      │     │         Azure            │
│  ┌───────────┐  │     │  ┌────────────────────┐  │
│  │ Next.js   │  │────▶│  │ Cosmos DB          │  │
│  │ App       │  │     │  │ (MongoDB API)      │  │
│  └───────────┘  │     │  │ Serverless         │  │
│                 │     │  └────────────────────┘  │
│  ┌───────────┐  │     │                          │
│  │ API Routes│  │     │  ┌────────────────────┐  │
│  │ (SSR/API) │  │     │  │ Azure Functions    │  │
│  └───────────┘  │     │  │ (Timer: 9PM CST)   │  │
└─────────────────┘     │  └────────────────────┘  │
                        │                          │
                        │  ┌────────────────────┐  │
                        │  │ Entra ID           │  │
                        │  │ (Authentication)   │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘
```

### Vercel Setup
- Connect GitHub repo to Vercel
- Environment variables configured in Vercel dashboard
- Automatic deployments on push to main
- Preview deployments for PRs

### Azure Resources
- **Cosmos DB**: Create account with MongoDB API, serverless capacity
- **Azure Functions**: Timer-triggered function for 9PM CST reminder
- **Entra ID**: App registration for SSO

### Estimated Monthly Cost: $0-5
- Vercel Pro: Existing subscription
- Cosmos DB Serverless: Free tier (1000 RU/s, 25GB)
- Azure Functions: Free tier (1M executions/month)

See `docs/adr/002-infrastructure.md` for full details.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Cosmos DB and get connection string
4. Configure environment variables
5. Push Prisma schema: `npx prisma db push`
6. Start development server: `npm run dev`
7. Open http://localhost:3000

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 111+ |
| Edge | 111+ |
| Firefox | 128+ (for Tailwind 4) |
| Safari | 16.4+ |

## Active Technologies
- TypeScript 5.1+ with Node.js 20.9.0+ (001-mood-tracking-app)
- Azure Cosmos DB with MongoDB API (serverless, pay-per-request) (001-mood-tracking-app)

## Recent Changes
- 001-mood-tracking-app: Added TypeScript 5.1+ with Node.js 20.9.0+
