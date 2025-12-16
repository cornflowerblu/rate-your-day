# API Contract: Ratings Endpoints

This document defines the API contract for the ratings endpoints to ensure compatibility between parallel implementations.

## Authentication

All endpoints require NextAuth session with valid `session.user.email`.

## Endpoints

### 1. GET /api/ratings (Month Query) - Implemented by Agent B

**Purpose**: Fetch all ratings for a specific month

**URL**: `/api/ratings?month=YYYY-MM`

**Query Parameters**:

- `month` (required): Month in format YYYY-MM (e.g., "2025-12")

**Request Example**:

```
GET /api/ratings?month=2025-12
```

**Response Example** (200 OK):

```json
{
  "ratings": [
    {
      "id": "507f1f77bcf86cd799439011",
      "date": "2025-12-01",
      "rating": 4,
      "notes": "Great day!",
      "createdAt": "2025-12-01T12:00:00.000Z",
      "updatedAt": "2025-12-01T12:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "date": "2025-12-15",
      "rating": 3,
      "createdAt": "2025-12-15T08:30:00.000Z",
      "updatedAt": "2025-12-15T08:30:00.000Z"
    }
  ],
  "month": "2025-12"
}
```

**Error Responses**:

- 400: Missing or invalid month parameter
  ```json
  { "error": "Missing required parameter: month" }
  ```
  ```json
  { "error": "Invalid month format. Expected YYYY-MM (e.g., 2025-12)" }
  ```
- 401: Unauthorized
  ```json
  { "error": "Unauthorized" }
  ```
- 500: Server error
  ```json
  { "error": "Internal server error", "details": "..." }
  ```

**Implementation Location**: `/src/app/api/ratings/route.ts`

---

### 2. GET /api/ratings/[date] (Single Day Query) - To be implemented by Agent A

**Purpose**: Fetch a single day's rating

**URL**: `/api/ratings/[date]` where `[date]` is YYYY-MM-DD

**Request Example**:

```
GET /api/ratings/2025-12-16
```

**Response Example** (200 OK):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "date": "2025-12-16",
  "rating": 4,
  "notes": "Productive day",
  "createdAt": "2025-12-16T12:00:00.000Z",
  "updatedAt": "2025-12-16T12:00:00.000Z"
}
```

**Error Responses**:

- 404: Rating not found
  ```json
  { "error": "Rating not found for this date" }
  ```
- 401: Unauthorized
- 500: Server error

**Implementation Location**: `/src/app/api/ratings/[date]/route.ts`

---

### 3. POST /api/ratings/[date] (Create/Update Rating) - To be implemented by Agent A

**Purpose**: Create or update a rating for a specific day

**URL**: `/api/ratings/[date]` where `[date]` is YYYY-MM-DD

**Request Body**:

```json
{
  "rating": 4,
  "notes": "Great day!" // Optional
}
```

**Request Example**:

```
POST /api/ratings/2025-12-16
Content-Type: application/json

{
  "rating": 4,
  "notes": "Great day!"
}
```

**Response Example** (200 OK for update, 201 Created for new):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "date": "2025-12-16",
  "rating": 4,
  "notes": "Great day!",
  "createdAt": "2025-12-16T12:00:00.000Z",
  "updatedAt": "2025-12-16T12:05:00.000Z"
}
```

**Error Responses**:

- 400: Invalid request body
  ```json
  { "error": "Invalid rating value. Must be 1, 2, 3, or 4" }
  ```
  ```json
  { "error": "Notes exceed maximum length of 280 characters" }
  ```
- 401: Unauthorized
- 500: Server error

**Validation Rules**:

- `rating`: Required, must be 1, 2, 3, or 4
- `notes`: Optional, max 280 characters
- `date`: Must be valid ISO date format (YYYY-MM-DD)

**Implementation Location**: `/src/app/api/ratings/[date]/route.ts`

---

### 4. DELETE /api/ratings/[date] (Delete Rating) - To be implemented for US5

**Purpose**: Delete a rating for a specific day

**URL**: `/api/ratings/[date]` where `[date]` is YYYY-MM-DD

**Request Example**:

```
DELETE /api/ratings/2025-12-16
```

**Response Example** (204 No Content):

```
(empty body)
```

**Error Responses**:

- 404: Rating not found
- 401: Unauthorized
- 500: Server error

**Implementation Location**: `/src/app/api/ratings/[date]/route.ts`

---

## Database Schema

**Model**: `DayRating` (from `/prisma/schema.prisma`)

```prisma
model DayRating {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  date      String   @unique // ISO format: YYYY-MM-DD
  rating    Int      // 1=angry, 2=sad, 3=average, 4=happy
  notes     String?  // Optional, max 280 characters
  userId    String   // User email from Entra ID
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, date])
}
```

**Key Points**:

- `date`: Unique per user (enforced via `@@index([userId, date])`)
- `userId`: Set to `session.user.email`
- `rating`: Integer 1-4, maps to mood levels
- `notes`: Optional, nullable field

---

## TypeScript Types

**From** `/src/lib/types.ts`:

```typescript
// Rating values
export type MoodLevel = 1 | 2 | 3 | 4

// Entity type
export interface DayRating {
  id: string
  date: string // ISO format: YYYY-MM-DD
  rating: 1 | 2 | 3 | 4
  notes?: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

// API request types
export interface CreateRatingRequest {
  date: string
  rating: 1 | 2 | 3 | 4
  notes?: string
}

export interface UpdateRatingRequest {
  rating?: 1 | 2 | 3 | 4
  notes?: string
}

// API response types
export interface RatingResponse {
  id: string
  date: string
  rating: 1 | 2 | 3 | 4
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MonthRatingsResponse {
  ratings: RatingResponse[]
  month: string // YYYY-MM format
}
```

---

## Shared Constants

**Mood Emojis** (from `/src/lib/types.ts`):

```typescript
export const MOOD_EMOJIS: Record<MoodLevel, MoodEmoji> = {
  1: { level: 1, emoji: '😠', label: 'Angry', color: '#ef4444' },
  2: { level: 2, emoji: '😢', label: 'Sad', color: '#f59e0b' },
  3: { level: 3, emoji: '😐', label: 'Average', color: '#6b7280' },
  4: { level: 4, emoji: '😊', label: 'Happy', color: '#10b981' },
}
```

---

## Integration Notes for Agent A

### Compatibility Considerations

1. **Date Format**: Always use `YYYY-MM-DD` format (ISO 8601)

   ```typescript
   import { format } from 'date-fns'
   const dateString = format(new Date(), 'yyyy-MM-dd')
   ```

2. **Rating Values**: Ensure rating is typed as `1 | 2 | 3 | 4`, not just `number`

3. **User Identification**: Always use `session.user.email` as `userId`

4. **Response Format**: Match the `RatingResponse` interface for consistency

5. **Error Handling**: Return appropriate HTTP status codes with error messages

### Testing Integration

After Agent A implements `/api/ratings/[date]`:

1. Create a rating via POST
2. Verify it appears in GET /api/ratings?month=YYYY-MM
3. Update the rating via POST (upsert behavior)
4. Verify updated data appears in month query
5. Delete the rating
6. Verify it's removed from month query

### Example: Creating a Rating and Seeing It in Calendar

```typescript
// Step 1: Create a rating (Agent A's endpoint)
await fetch('/api/ratings/2025-12-16', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rating: 4, notes: 'Great day!' }),
})

// Step 2: Calendar fetches month (Agent B's endpoint)
const response = await fetch('/api/ratings?month=2025-12')
const data = await response.json()

// Step 3: Calendar displays the rating
// The Calendar component will automatically show the emoji
// for 2025-12-16 in the calendar grid
```

---

## Version

**Document Version**: 1.0
**Last Updated**: 2025-12-16
**Updated By**: Agent B (US3 Implementation)
