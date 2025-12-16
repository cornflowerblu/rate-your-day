# Quickstart: Mood Tracking Application

**Date**: 2025-12-15
**Status**: Complete
**Related**: [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md)

## Prerequisites

- Node.js 20.9.0 or later
- Git
- Azure CLI (for Cosmos DB and Functions setup)
- Vercel CLI (optional, for local deployment testing)

## Initial Setup (10 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/rate-your-day.git
cd rate-your-day
```

### 2. Install Dependencies

```bash
npm install

# Install Playwright browsers for E2E testing
npx playwright install
```

Expected packages:

- next@16.x
- react@19.2
- typescript@5.1+
- prisma@7.x
- next-auth@5.x
- tailwind@4.0
- date-fns, web-push, idb, use-debounce

### 3. Environment Variables

Create `.env.local`:

```bash
# Database (Azure Cosmos DB with MongoDB API)
DATABASE_URL="mongodb+srv://cosmos-rate-your-day.mongo.cosmos.azure.com:10255/?retryWrites=false"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Microsoft Entra ID (Azure AD)
AZURE_AD_CLIENT_ID="your-app-registration-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"
OWNER_EMAIL="your-email@example.com"

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-vapid-key"
VAPID_PRIVATE_KEY="your-private-vapid-key"
VAPID_SUBJECT="mailto:your-email@example.com"
```

**Generate VAPID Keys**:

```bash
npx web-push generate-vapid-keys
```

### 4. Azure Resources Setup

#### Cosmos DB

```bash
# Create resource group
az group create --name rg-rate-your-day --location eastus

# Create Cosmos DB account (MongoDB API, serverless)
az cosmosdb create \
  --name cosmos-rate-your-day \
  --resource-group rg-rate-your-day \
  --kind MongoDB \
  --capabilities EnableServerless \
  --default-consistency-level Session

# Get connection string
az cosmosdb keys list \
  --name cosmos-rate-your-day \
  --resource-group rg-rate-your-day \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv
```

#### Entra ID App Registration

```bash
# Create app registration
az ad app create \
  --display-name "Rate Your Day" \
  --web-redirect-uris "http://localhost:3000/api/auth/callback/microsoft-entra-id" \
  --sign-in-audience AzureADMyOrg

# Note the appId (CLIENT_ID) from output
# Create client secret via Azure Portal → App registrations → Certificates & secrets
```

### 5. Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Cosmos DB
npx prisma db push
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure Overview

```
rate-your-day/
├── src/app/              # Next.js App Router pages & API
├── src/components/       # React components
├── src/lib/              # Utilities (db, auth, push)
├── prisma/schema.prisma  # Database schema
├── public/               # Static assets, service worker
├── azure-functions/      # Azure Functions (separate deployment)
└── tests/                # Test files
```

## Common Development Tasks

### Run Tests

```bash
# Unit tests (Jest)
npm test

# E2E tests (Playwright) - Phase 11
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # See browser during tests
npm run test:e2e:report    # View test report

# Watch mode
npm test -- --watch
```

### Database Management

```bash
# View data in Prisma Studio
npx prisma studio

# Reset database (development only!)
npx prisma db push --force-reset
```

### Type Checking

```bash
# Run TypeScript compiler
npm run type-check

# Watch mode
npm run type-check -- --watch
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Build for Production

```bash
# Build Next.js app
npm run build

# Test production build locally
npm start
```

## Authentication Flow

1. User visits app → redirected to `/api/auth/signin`
2. NextAuth.js redirects to Microsoft Entra ID login
3. User logs in with Microsoft account
4. Entra ID validates and returns to callback
5. NextAuth.js checks if email matches `OWNER_EMAIL`
6. If valid, creates session and redirects to home page
7. All subsequent requests include session cookie

**Test Authentication**:

```bash
# Visit app
open http://localhost:3000

# Should redirect to Microsoft login
# After login, should see mood selector
```

## API Testing

### Using curl

```bash
# Get month's ratings (requires session cookie from browser)
curl -X GET 'http://localhost:3000/api/ratings?month=2025-12' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'

# Create rating
curl -X POST 'http://localhost:3000/api/ratings/2025-12-15' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN' \
  -d '{"rating": 4, "notes": "Great day!"}'
```

### Using Postman/Insomnia

1. Import `specs/001-mood-tracking-app/contracts/api-spec.yaml`
2. Set base URL to `http://localhost:3000/api`
3. Add session cookie from browser DevTools

## PWA Testing

### Test Offline Mode

1. Open app in Chrome
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Refresh page → should load from cache
5. Create rating → saved to IndexedDB
6. Uncheck "Offline" → automatic sync

### Test Installation

1. Open app in Chrome
2. Click address bar install icon
3. App opens in standalone window
4. Test functionality

## Azure Functions Deployment

```bash
cd azure-functions

# Install dependencies
npm install

# Deploy to Azure
func azure functionapp publish func-rate-your-day-reminder
```

**Configure Environment Variables** in Azure Portal:

- `DATABASE_URL`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Vercel Deployment

### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to link GitHub repo
```

### Environment Variables

Add all `.env.local` variables in Vercel Dashboard:

- Project Settings → Environment Variables
- Add production values
- Redeploy

### Verify Deployment

```bash
# Check build logs
vercel logs

# Visit production URL
open https://rate-your-day.vercel.app
```

## Troubleshooting

### Database Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**:

- Verify `DATABASE_URL` includes `?retryWrites=false`
- Check connection string from Azure Portal
- Ensure IP allowed in Cosmos DB firewall

### Authentication Not Working

**Error**: Redirect loop or "unauthorized"

**Solution**:

- Verify `OWNER_EMAIL` matches your Microsoft account
- Check `NEXTAUTH_URL` matches current URL
- Regenerate `NEXTAUTH_SECRET`

### Push Notifications Not Sending

**Error**: VAPID keys invalid

**Solution**:

- Regenerate VAPID keys: `npx web-push generate-vapid-keys`
- Update both `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- Clear browser cache and resubscribe

### Build Errors

**Error**: `Module not found` or TypeScript errors

**Solution**:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

1. **Review ADRs**: Read [docs/adr/001-framework-selection.md](../../docs/adr/001-framework-selection.md) and [docs/adr/002-infrastructure.md](../../docs/adr/002-infrastructure.md)
2. **Explore Spec**: Read [spec.md](./spec.md) for feature requirements
3. **Check Data Model**: Review [data-model.md](./data-model.md) for schema details
4. **API Reference**: See [contracts/api-spec.yaml](./contracts/api-spec.yaml) for endpoint documentation
5. **Implementation**: Run `/speckit.tasks` to generate task breakdown

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma studio        # Open Prisma Studio
npx prisma db push       # Push schema changes
npx prisma generate      # Regenerate Prisma client

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Run linter
npm run type-check       # TypeScript check

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
func azure functionapp publish <name>  # Deploy Azure Functions
```

## Getting Help

- **Documentation**: Check CLAUDE.md for project guide
- **ADRs**: Review docs/adr/ for architecture decisions
- **Spec**: Read spec.md for feature details
- **API**: Reference contracts/api-spec.yaml for endpoints
- **Issues**: Report bugs on GitHub Issues

## Additional Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Vercel Docs](https://vercel.com/docs)
- [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
