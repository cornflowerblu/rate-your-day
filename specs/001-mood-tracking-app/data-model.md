# Data Model: Mood Tracking Application

**Date**: 2025-12-15
**Status**: Complete
**Related**: [plan.md](./plan.md), [research.md](./research.md)

## Overview

The data model supports daily mood ratings with optional notes, user authentication, and push notification subscriptions. Uses Prisma 7 with Azure Cosmos DB (MongoDB API).

## Entities

### 1. DayRating

Represents a single day's mood entry.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, ObjectId | MongoDB document ID |
| date | String | @unique, ISO format | YYYY-MM-DD date string |
| rating | Int | 1-4 | Mood level: 1=angry, 2=sad, 3=average, 4=happy |
| notes | String? | Optional, max 280 chars | User's note for the day |
| userId | String | Required | User email from Entra ID |
| createdAt | DateTime | Auto-generated | Record creation timestamp |
| updatedAt | DateTime | Auto-updated | Last modification timestamp |

**Indexes**:
- Unique on `date` (primary lookup)
- Composite index on `[userId, date]` (user-specific queries)

**Validation Rules** (enforced in application layer):
- `date` must be in YYYY-MM-DD format, lowercase
- `rating` must be 1, 2, 3, or 4
- `notes` limited to 280 characters
- `date` cannot be in the future
- One rating per day per user

**State Transitions**:
```
[No Rating] → [Created] → [Updated] → [Deleted]
                  ↓
              [Updated]
```

**Prisma Schema**:
```prisma
model DayRating {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      String   @unique
  rating    Int
  notes     String?
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, date])
}
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "date": "2025-12-15",
  "rating": 4,
  "notes": "Had a great day! Finished the project.",
  "userId": "owner@example.com",
  "createdAt": "2025-12-15T14:30:00.000Z",
  "updatedAt": "2025-12-15T14:30:00.000Z"
}
```

### 2. PushSubscription

Stores Web Push API subscription details for notifications.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, ObjectId | MongoDB document ID |
| userId | String | @unique | User email from Entra ID (one subscription per user) |
| endpoint | String | Required | Push service endpoint URL |
| keys | Json | Required | VAPID keys: { p256dh, auth } |
| createdAt | DateTime | Auto-generated | Subscription creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Validation Rules**:
- `userId` must be unique (one active subscription per user)
- `endpoint` must be a valid URL
- `keys` must contain `p256dh` and `auth` properties

**Lifecycle**:
```
[User Grants Permission] → [Subscribe] → [Store Subscription]
                                             ↓
                            [Send Notification] or [Unsubscribe]
```

**Prisma Schema**:
```prisma
model PushSubscription {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @unique
  endpoint  String
  keys      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Sample Document**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "owner@example.com",
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRd...",
    "auth": "tBHI..."
  },
  "createdAt": "2025-12-15T10:00:00.000Z",
  "updatedAt": "2025-12-15T10:00:00.000Z"
}
```

## Relationships

### User → Ratings (1:Many)
- One user (identified by `userId`) can have many `DayRating` records
- Not explicitly modeled as relationship (MongoDB stores denormalized)
- Queried via: `prisma.dayRating.findMany({ where: { userId } })`

### User → Subscription (1:1)
- One user can have one active `PushSubscription`
- Enforced by `@unique` on `userId`
- Old subscriptions are replaced when user resubscribes

## Query Patterns

### Get Month's Ratings
```typescript
const ratings = await prisma.dayRating.findMany({
  where: {
    userId: session.user.email,
    date: {
      gte: '2025-12-01',
      lte: '2025-12-31'
    }
  },
  orderBy: { date: 'asc' }
});
```

### Get or Create Today's Rating
```typescript
const today = new Date().toISOString().split('T')[0];

const rating = await prisma.dayRating.upsert({
  where: { date: today },
  update: { rating: newRating, notes: newNotes },
  create: {
    date: today,
    rating: newRating,
    notes: newNotes,
    userId: session.user.email
  }
});
```

### Check if User Rated Today
```typescript
const today = new Date().toISOString().split('T')[0];

const rating = await prisma.dayRating.findUnique({
  where: { date: today }
});

const hasRated = !!rating;
```

### Get User's Push Subscription
```typescript
const subscription = await prisma.pushSubscription.findUnique({
  where: { userId: session.user.email }
});
```

## Data Migration Strategy

**Initial Setup** (v1):
- Run `npx prisma db push` (MongoDB doesn't use migrations)
- Cosmos DB creates collections automatically

**Future Changes**:
- Use `prisma migrate dev` for local MongoDB
- Use `prisma db push` for Cosmos DB (no migration files)
- Document schema changes in new ADRs

## Performance Considerations

### Indexes
- `date` unique index: Fast single-day lookups
- `[userId, date]` composite: Fast user-specific month queries
- Cosmos DB auto-indexes `_id` field

### Query Optimization
- Limit month queries to 31 days (one month max)
- Use `findUnique` for single-day lookups (leverages unique index)
- Avoid `$regex` or case-insensitive queries (Cosmos DB quirk)

### Capacity Planning
- Single user: ~100 ratings/month = ~1200 ratings/year
- Each rating: ~200 bytes (with 280 char notes)
- Yearly storage: ~240 KB
- Well within Cosmos DB free tier (25 GB)

## Cosmos DB Specific Considerations

### Known Quirks
1. **Case Sensitivity**: Unique indexes are case-sensitive; always use lowercase dates
2. **Latency**: `updatedAt` may lag by a few milliseconds
3. **Transactions**: Not required for our single-document operations
4. **Connection Pooling**: Reuse Prisma client (singleton pattern)

### Connection String Format
```
DATABASE_URL="mongodb+srv://cosmos-rate-your-day.mongo.cosmos.azure.com:10255/?retryWrites=false"
```

Note: `retryWrites=false` required for Cosmos DB MongoDB API.

## Testing Strategy

### Unit Tests
- Validate date format parsing
- Test rating value constraints (1-4)
- Verify notes character limit (280)

### Integration Tests
- Create, read, update, delete rating
- Upsert logic (update existing or create new)
- Query month range
- Push subscription CRUD

### Test Data
```typescript
const testRatings = [
  { date: '2025-12-01', rating: 3, notes: 'Okay day', userId: 'test@example.com' },
  { date: '2025-12-02', rating: 4, notes: 'Great day!', userId: 'test@example.com' },
  { date: '2025-12-03', rating: 2, notes: 'Rough day', userId: 'test@example.com' }
];
```

## Future Enhancements (Out of Scope for v1)

- **UserProfile** model: Store user preferences, timezone
- **Streak** tracking: Consecutive rating days
- **Tags** or **Categories**: Categorize mood triggers
- **Export** functionality: CSV/JSON download
- **Analytics**: Mood trends, averages, insights

## References

- [Prisma MongoDB Docs](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Cosmos DB MongoDB API](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/)
- [ADR 002: Infrastructure](../../docs/adr/002-infrastructure.md)
