# Rate Your Day

A personal mood tracking application built with Next.js 16, featuring emoji-based daily ratings, calendar views, and PWA capabilities with offline support.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## Quick Start

Get up and running in 10 minutes:

```bash
# Clone and install
git clone https://github.com/cornflowerblu/rate-your-day.git
cd rate-your-day
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Azure credentials

# Push database schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

For detailed setup instructions, see [Quickstart Guide](specs/001-mood-tracking-app/quickstart.md).

## What is Rate Your Day?

Rate Your Day helps you track your daily emotional state with minimal effort. Simply tap an emoji (😠 😢 😐 😊) to record how your day went, add optional notes, and view your mood patterns over time in a beautiful calendar interface.

**Core Features:**
- One-tap daily mood rating (4 emoji scale)
- Monthly calendar view showing mood patterns
- Optional notes for each day (280 characters)
- Offline support with automatic sync
- Daily 9 PM reminders via push notifications
- Installable as standalone PWA on mobile and desktop

## Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| Framework | Next.js 16 + React 19.2 | App Router, Server Components, Turbopack |
| Language | TypeScript 5.1+ | Type safety throughout |
| Styling | Tailwind CSS 4.0 | Utility-first, 5x faster builds |
| Database | Azure Cosmos DB (MongoDB API) | Serverless, pay-per-request |
| ORM | Prisma 7 | TypeScript-based, Rust-free |
| Auth | Microsoft Entra ID | SSO via NextAuth.js |
| Hosting | Vercel Pro | First-party Next.js support |
| Scheduler | Azure Functions | Timer Trigger for notifications |

See [ADR 001: Framework Selection](docs/adr/001-framework-selection.md) and [ADR 002: Infrastructure](docs/adr/002-infrastructure.md) for detailed rationale.

## Project Structure

```
rate-your-day/
├── src/app/              # Next.js App Router pages & API routes
├── src/components/       # React components (MoodSelector, Calendar, etc.)
├── src/lib/              # Utilities (db, auth, push)
├── prisma/schema.prisma  # Database schema
├── public/               # Static assets, service worker
├── azure-functions/      # Azure Functions (daily reminder)
├── specs/                # Feature specifications
│   └── 001-mood-tracking-app/
│       ├── spec.md       # Feature requirements (WHAT & WHY)
│       ├── plan.md       # Implementation plan (HOW)
│       ├── tasks.md      # Task breakdown (115 tasks)
│       ├── data-model.md # Database schema details
│       └── quickstart.md # Setup guide
└── docs/adr/             # Architecture Decision Records
    ├── 001-framework-selection.md
    └── 002-infrastructure.md
```

## Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Project guide for AI assistants |
| [Quickstart Guide](specs/001-mood-tracking-app/quickstart.md) | 10-minute setup instructions |
| [Feature Specification](specs/001-mood-tracking-app/spec.md) | Complete requirements (8 user stories) |
| [Implementation Plan](specs/001-mood-tracking-app/plan.md) | Technical architecture |
| [Task Breakdown](specs/001-mood-tracking-app/tasks.md) | 115 tasks organized by story |
| [Agent Execution Plan](specs/001-mood-tracking-app/agent-execution-plan.md) | Parallel implementation strategy |
| [Data Model](specs/001-mood-tracking-app/data-model.md) | Prisma schema & query patterns |
| [API Specification](specs/001-mood-tracking-app/contracts/api-spec.yaml) | OpenAPI 3.0 REST API docs |

## Development

```bash
# Development server (Turbopack enabled by default)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test                 # Unit tests
npm run test:e2e         # E2E tests (Playwright)

# Database
npx prisma studio        # Browse data
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate client

# Build
npm run build            # Production build
npm start                # Start production server
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────────┐
│     Vercel      │     │         Azure            │
│  ┌───────────┐  │     │  ┌────────────────────┐  │
│  │ Next.js   │◄─┼─────┼─►│ Cosmos DB          │  │
│  │ App       │  │     │  │ (MongoDB API)      │  │
│  └───────────┘  │     │  │ Serverless         │  │
│                 │     │  └────────────────────┘  │
│  ┌───────────┐  │     │                          │
│  │ API Routes│  │     │  ┌────────────────────┐  │
│  │ Serverless│  │     │  │ Azure Functions    │  │
│  └───────────┘  │     │  │ (9 PM Reminder)    │  │
└─────────────────┘     │  └────────────────────┘  │
                        │                          │
                        │  ┌────────────────────┐  │
                        │  │ Entra ID           │  │
                        │  │ (Auth SSO)         │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘
```

## Implementation Strategy

This project uses **parallel agent execution** for efficient development. See [Agent Execution Plan](specs/001-mood-tracking-app/agent-execution-plan.md) for details.

**Timeline**: ~8-12 hours (vs. 24-30 hours sequential)

### Phases

1. **Phase 0**: Foundation (T001-T022) - Sequential setup
2. **Wave 1**: 4 agents in parallel implementing US1, US3, US6, US7
3. **Wave 2**: 4 agents in parallel implementing US2, US4, US5, US8
4. **Polish**: Accessibility, E2E tests, deployment

## Speckit Framework

This project follows the [Speckit](https://github.com/github/spec-kit) workflow for structured feature development:

```bash
/speckit.specify   # Create feature specification (WHAT & WHY)
/speckit.plan      # Generate implementation plan (HOW)
/speckit.tasks     # Break down into tasks
/speckit.implement # Execute implementation
```

**IMPORTANT**: Always check `specs/` and `docs/adr/` before making architecture decisions.

## Environment Variables

Create `.env.local`:

```bash
# Database (Azure Cosmos DB)
DATABASE_URL="mongodb+srv://..."

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Microsoft Entra ID
AZURE_AD_CLIENT_ID="your-app-id"
AZURE_AD_CLIENT_SECRET="your-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
OWNER_EMAIL="your-email@example.com"

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
VAPID_SUBJECT="mailto:your-email@example.com"
```

Generate VAPID keys: `npx web-push generate-vapid-keys`

## API Documentation

View the OpenAPI specification:

**Option 1** (Quickest): [Swagger Editor](https://editor.swagger.io/) - Copy/paste `specs/001-mood-tracking-app/contracts/api-spec.yaml`

**Option 2**: VS Code extension - Install "OpenAPI Editor" by 42Crunch

**Option 3**: Run locally - See [Quickstart](specs/001-mood-tracking-app/quickstart.md#api-testing)

## Deployment

### Vercel

```bash
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
```

Environment variables must be configured in Vercel Dashboard.

### Azure Functions

```bash
cd azure-functions
func azure functionapp publish func-rate-your-day-reminder
```

See [Quickstart](specs/001-mood-tracking-app/quickstart.md#azure-functions-deployment) for full details.

## User Stories

| Priority | User Story | Status |
|----------|-----------|--------|
| P1 | Quick Daily Mood Rating | 📋 Planned |
| P2 | Add Context Notes | 📋 Planned |
| P2 | View Monthly Mood Patterns | 📋 Planned |
| P3 | Navigate Historical Data | 📋 Planned |
| P3 | Review and Edit Past Days | 📋 Planned |
| P3 | Receive Daily Reminder | 📋 Planned |
| P4 | Offline Mood Tracking | 📋 Planned |
| P4 | Install as Standalone App | 📋 Planned |

See [Feature Specification](specs/001-mood-tracking-app/spec.md) for complete acceptance criteria.

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 111+ |
| Edge | 111+ |
| Firefox | 128+ |
| Safari | 16.4+ |

## Cost Estimate

**Monthly**: $0-5 USD (single user, low traffic)

- Vercel Pro: Existing subscription
- Cosmos DB Serverless: Free tier (1000 RU/s, 25 GB)
- Azure Functions: Free tier (1M executions/month)

## Contributing

This is a personal project, but if you want to reference it:

1. Check existing [ADRs](docs/adr/) before architectural changes
2. Use Speckit workflow for new features
3. Update CLAUDE.md with project context changes
4. Follow TypeScript strict mode + ESLint rules

## License

MIT License - See [LICENSE](LICENSE) for details.

## Getting Help

- **Documentation**: Start with [CLAUDE.md](CLAUDE.md)
- **Setup Issues**: See [Quickstart Troubleshooting](specs/001-mood-tracking-app/quickstart.md#troubleshooting)
- **Architecture Questions**: Review [ADRs](docs/adr/)
- **Feature Details**: Read [Feature Spec](specs/001-mood-tracking-app/spec.md)
- **API Reference**: Check [API Spec](specs/001-mood-tracking-app/contracts/api-spec.yaml)

---

Built with Next.js 16, TypeScript, and Azure. Deployed on Vercel.
