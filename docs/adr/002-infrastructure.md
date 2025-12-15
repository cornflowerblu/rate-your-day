# ADR 002: Infrastructure - Vercel + Azure Serverless

## Status
Accepted

## Context
We need a low-cost, serverless infrastructure for the Rate Your Day application. Key requirements:
- Minimal operational overhead
- Pay-per-use pricing (near-zero cost for single-user app)
- Best-in-class Next.js hosting
- Prisma ORM compatibility
- Azure services for learning/familiarity

### Options Considered

| Option | Hosting | Database | Notes |
|--------|---------|----------|-------|
| **A. Vercel + Cosmos DB** | Vercel | Cosmos DB (MongoDB API) | Best Next.js DX, Prisma works |
| B. Azure Static Web Apps | Azure SWA | Cosmos DB | All Azure, but limited Next.js |
| C. Azure Container Apps | Azure ACA | PostgreSQL | Overkill, always-on costs |
| D. AKS | Azure AKS | PostgreSQL | Too expensive, shut down |

## Decision
**Option A: Vercel + Azure Cosmos DB (MongoDB API)**

## Rationale

### Why Vercel for Hosting
- First-party Next.js support (made by same company)
- All Next.js 16 features work perfectly (App Router, RSC, ISR, Middleware)
- Existing Pro subscription available
- Excellent DX: preview deploys, instant rollbacks
- Edge network for fast global performance

### Why Cosmos DB with MongoDB API
- **Prisma compatibility**: MongoDB provider works with Cosmos DB
- **Serverless pricing**: Pay only for Request Units consumed
- **Free tier**: 1000 RU/s + 25GB storage (more than enough)
- **Familiar DX**: MongoDB query syntax, similar to DynamoDB experience
- **Azure learning**: Exposes Azure portal, monitoring, etc.

### Why Not All-Azure
- Azure Static Web Apps has limited Next.js support (ISR, middleware issues)
- Vercel Pro subscription already exists
- Better to use best tool for each job than force all-Azure

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Internet                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js 16 App                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │   Pages     │  │ API Routes  │  │ Server Actions  │  │    │
│  │  │   (SSR)     │  │ (Serverless)│  │ (RSC)           │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ Auth                 │ Data                 │ Push
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Azure                                  │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Entra ID      │  │   Cosmos DB     │  │ Azure Functions │  │
│  │                 │  │   (MongoDB)     │  │                 │  │
│  │  • SSO          │  │                 │  │  • Timer Trigger│  │
│  │  • OAuth 2.0    │  │  • Serverless   │  │  • 9PM CST      │  │
│  │  • Single user  │  │  • Free tier    │  │  • Push notify  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cost Analysis

### Vercel (Existing Pro Subscription)
| Resource | Included | Notes |
|----------|----------|-------|
| Bandwidth | 1TB/month | Way more than needed |
| Serverless Functions | 1000 GB-hrs | Way more than needed |
| Build minutes | 6000/month | Way more than needed |

### Azure Cosmos DB (Free Tier)
| Resource | Free Tier | Our Usage |
|----------|-----------|-----------|
| Request Units | 1000 RU/s | ~10-50 RU/s |
| Storage | 25 GB | <1 GB |
| **Monthly Cost** | **$0** | Stays in free tier |

### Azure Functions (Consumption Plan)
| Resource | Free Tier | Our Usage |
|----------|-----------|-----------|
| Executions | 1M/month | 30/month (daily timer) |
| GB-seconds | 400,000/month | <100/month |
| **Monthly Cost** | **$0** | Stays in free tier |

### Azure Entra ID
| Resource | Free Tier | Notes |
|----------|-----------|-------|
| Users | 50,000 | We have 1 |
| Authentications | Unlimited | Free for basic |
| **Monthly Cost** | **$0** | |

### Total Estimated Cost: **$0/month**
(Assuming Vercel Pro is already paid for other projects)

## Implementation

### Vercel Setup
1. Connect GitHub repository
2. Configure environment variables in dashboard
3. Set production branch to `main`
4. Enable preview deployments for PRs

### Cosmos DB Setup
```bash
# Create resource group
az group create --name rg-rate-your-day --location eastus

# Create Cosmos DB account with MongoDB API
az cosmosdb create \
  --name cosmos-rate-your-day \
  --resource-group rg-rate-your-day \
  --kind MongoDB \
  --capabilities EnableServerless \
  --default-consistency-level Session

# Create database
az cosmosdb mongodb database create \
  --account-name cosmos-rate-your-day \
  --resource-group rg-rate-your-day \
  --name rate-your-day

# Get connection string for Prisma
az cosmosdb keys list \
  --name cosmos-rate-your-day \
  --resource-group rg-rate-your-day \
  --type connection-strings
```

### Azure Functions Setup
```bash
# Create Function App
az functionapp create \
  --name func-rate-your-day-reminder \
  --resource-group rg-rate-your-day \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --storage-account <storage-account-name>
```

### Prisma Configuration
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model DayRating {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      String   @unique
  rating    Int
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Consequences

### Positive
- Near-zero operational cost
- Best-in-class Next.js deployment experience
- Prisma works unchanged (just different provider)
- Azure learning through Cosmos DB, Functions, Entra ID
- Simple architecture, easy to understand and maintain

### Negative
- Split across two platforms (Vercel + Azure)
- Need to manage Azure Functions separately from main app
- Cosmos DB MongoDB API has some quirks vs real MongoDB

### Mitigations
- Azure Functions are simple (one timer trigger)
- Cosmos DB quirks are minor for our simple use case
- Both platforms have good free tiers

## Alternatives Rejected

### AKS (Previous Plan)
- Too expensive (~$150+/month minimum)
- Overkill for single-user app
- Cluster has been shut down

### Azure Static Web Apps
- Limited Next.js support
- No ISR, limited middleware
- Would require workarounds

### Azure Container Apps
- More complex than needed
- Not truly serverless (minimum costs)
- No benefit over Vercel for Next.js

## References
- [Vercel Documentation](https://vercel.com/docs)
- [Cosmos DB MongoDB API](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/)
- [Prisma MongoDB Connector](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Azure Functions Timer Trigger](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer)
