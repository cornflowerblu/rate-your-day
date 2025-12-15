# Implementation Plan: Mood Tracking Application

**Branch**: `001-mood-tracking-app` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mood-tracking-app/spec.md`

**Note**: This plan uses existing architecture decisions from `docs/adr/001-framework-selection.md` and `docs/adr/002-infrastructure.md`.

## Summary

A simple mood tracking web application that allows users to rate their day with emoji faces (angry, sad, average, happy) and view historical patterns in a calendar view. The application prioritizes speed (< 3 seconds to rate), works offline via PWA capabilities, and sends daily 9 PM reminders. Built with Next.js 16 App Router, deployed to Vercel with Azure backend services (Cosmos DB, Entra ID, Functions).

## Technical Context

**Language/Version**: TypeScript 5.1+ with Node.js 20.9.0+
**Framework**: Next.js 16 with App Router, React 19.2, Turbopack (default in Next.js 16)
**Primary Dependencies**:
- NextAuth.js (Azure AD provider for Entra ID)
- Prisma 7 (MongoDB provider)
- Tailwind CSS 4.0
- date-fns or react-calendar (calendar component library)
- web-push (push notification handling)

**Storage**: Azure Cosmos DB with MongoDB API (serverless, pay-per-request)
**Authentication**: Microsoft Entra ID (single user SSO via OAuth 2.0)
**Hosting**: Vercel Pro (existing subscription)
**Backend Services**: Azure Functions (Timer Trigger for 9 PM CST notifications)
**Testing**: Jest + React Testing Library, Playwright for E2E
**Target Platform**: Web (mobile-first PWA), browsers: Chrome 111+, Safari 16.4+, Firefox 128+, Edge 111+
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**:
- Initial page load < 2 seconds
- Interaction response < 100ms
- Auto-save latency < 500ms
- Calendar render < 1 second

**Constraints**:
- Offline-capable (PWA with Service Worker)
- WCAG AA accessibility compliance
- Single authenticated user (owner only for v1)
- CST timezone (9 PM notification)

**Scale/Scope**:
- Single user application
- ~50-100 mood ratings/month
- <100 API requests/day
- Minimal database storage (<1GB)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: The project constitution template is not yet populated. Proceeding with industry best practices:

✓ **Simplicity**: Single Next.js app, no unnecessary abstractions
✓ **Testing**: Component tests, E2E tests for critical flows
✓ **Documentation**: ADRs already established, will add quickstart
✓ **Security**: OAuth 2.0 via Entra ID, environment variables for secrets
✓ **Performance**: Metrics defined in spec success criteria

No constitution violations identified. The architecture follows standard Next.js patterns without unnecessary complexity.

## Project Structure

### Documentation (this feature)

```text
specs/001-mood-tracking-app/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technologies and patterns)
├── data-model.md        # Phase 1 output (database schema)
├── quickstart.md        # Phase 1 output (developer onboarding)
├── contracts/           # Phase 1 output (API specifications)
│   └── api-spec.yaml    # OpenAPI specification
├── checklists/          # Quality gates
│   └── requirements.md  # Specification validation (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
rate-your-day/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with auth provider
│   │   ├── page.tsx              # Home - today's rating + calendar
│   │   ├── manifest.ts           # PWA Web App Manifest
│   │   ├── api/                  # API Routes (Vercel serverless)
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js
│   │   │   ├── ratings/
│   │   │   │   ├── route.ts      # GET /api/ratings?month=YYYY-MM
│   │   │   │   └── [date]/route.ts  # GET/POST/DELETE /api/ratings/:date
│   │   │   └── push/
│   │   │       ├── subscribe/route.ts    # POST /api/push/subscribe
│   │   │       └── send/route.ts         # POST /api/push/send (internal)
│   │   └── offline.html          # Offline fallback
│   ├── components/
│   │   ├── MoodSelector.tsx      # Four emoji rating buttons
│   │   ├── Calendar.tsx          # Monthly calendar grid
│   │   ├── DayCell.tsx           # Individual calendar day
│   │   ├── DayDetailModal.tsx    # Past day edit modal
│   │   ├── NotesInput.tsx        # 280 char notes field
│   │   └── OfflineIndicator.tsx  # Online/offline status
│   ├── lib/
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── auth.ts               # NextAuth.js config
│   │   ├── push.ts               # Push notification helpers
│   │   └── types.ts              # TypeScript types
│   └── styles/
│       └── globals.css           # Tailwind imports + global styles
├── prisma/
│   └── schema.prisma             # Database schema (MongoDB)
├── public/
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # PWA app icons
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── offline.html              # Offline fallback page
├── azure-functions/              # Azure Functions (separate deploy)
│   └── daily-reminder/
│       ├── function.json         # Timer trigger config (9PM CST)
│       └── index.ts              # Notification logic
├── tests/
│   ├── e2e/                      # Playwright end-to-end
│   │   ├── rating-flow.spec.ts
│   │   ├── calendar.spec.ts
│   │   └── offline.spec.ts
│   └── components/               # Jest + React Testing Library
│       ├── MoodSelector.test.tsx
│       ├── Calendar.test.tsx
│       └── NotesInput.test.tsx
├── .env.local.example            # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS 4.0 config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies

docs/adr/                         # Architecture Decision Records
├── 001-framework-selection.md    # Next.js 16+ decision
└── 002-infrastructure.md         # Vercel + Azure decision
```

**Structure Decision**: Using Next.js App Router structure (Option 2: Web application). The `src/app` directory contains pages and API routes co-located. Components are in `src/components` following Next.js 16 conventions. Azure Functions are separate since they deploy independently to Azure. This structure maximizes Next.js App Router benefits while keeping Azure-specific code isolated.

## Complexity Tracking

No constitution violations to justify. The architecture uses standard patterns:
- Single Next.js monolith (no microservices)
- Direct Prisma database access (no repository pattern)
- Simple REST API (no GraphQL)
- Standard NextAuth.js authentication (no custom auth)
