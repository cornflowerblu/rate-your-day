# User Story 3: View Monthly Mood Patterns - Implementation Notes

## Overview

This document provides implementation details for User Story 3, which displays a monthly calendar view showing mood patterns across the month.

## Architecture

### Component Hierarchy

```
Calendar (Container Component)
├── Month/Year Header
├── Week Day Labels (Sun-Sat)
├── Loading Skeleton (conditional)
├── Error Banner (conditional)
└── Calendar Grid
    └── DayCell × 35-42 (varies by month)
        ├── Day Number
        ├── Mood Emoji (if rated)
        ├── Empty Indicator (if unrated)
        └── Today Indicator (if today)
```

### Data Flow

```
Calendar Component
    ↓ (on mount, month change)
Fetch /api/ratings?month=YYYY-MM
    ↓
API Route (validates auth, queries DB)
    ↓
Prisma → MongoDB (DayRating collection)
    ↓
Transform to RatingResponse[]
    ↓
Calendar (convert to Map for O(1) lookup)
    ↓
Render DayCell for each date
```

## Implementation Details

### Calendar Grid Generation

The calendar grid is generated using date-fns utilities:

```typescript
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns'

// 1. Get month boundaries
const monthStart = startOfMonth(currentMonth) // e.g., Dec 1, 2025
const monthEnd = endOfMonth(currentMonth) // e.g., Dec 31, 2025

// 2. Expand to full weeks (Sunday-Saturday)
const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Nov 30, 2025
const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }) // Jan 3, 2026

// 3. Generate all dates in range
const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
// Returns: [Nov 30, Dec 1, Dec 2, ..., Dec 31, Jan 1, Jan 2, Jan 3]
```

**Why full weeks?**

- Ensures consistent grid layout (always 7 columns)
- Provides context (users can see adjacent month dates)
- Standard calendar UX pattern

**Week starts on Sunday**:

- Set via `weekStartsOn: 0` (Sunday = 0, Monday = 1, etc.)
- Can be changed to Monday-Sunday by using `weekStartsOn: 1`

### Performance Optimizations

#### 1. Memoized Calendar Days

```typescript
const calendarDays = useMemo(() => {
  // ... date calculation
}, [currentMonth])
```

**Benefit**: Prevents recalculating dates on every render (e.g., on hover state changes)

#### 2. Ratings Map

```typescript
// Convert array to map
const ratingsMap: Record<string, MoodLevel> = {}
data.ratings.forEach((rating: RatingData) => {
  ratingsMap[rating.date] = rating.rating
})
```

**Why?**

- Array lookup: O(n) for each cell = O(n × 35) total
- Map lookup: O(1) for each cell = O(35) total
- ~30x faster for typical month with 30 days

#### 3. Selective Database Queries

```typescript
where: {
  userId: session.user.email,
  date: {
    gte: startDate,  // "2025-12-01"
    lte: endDate,    // "2025-12-31"
  },
}
```

**Benefit**: Only fetch data for the requested month, not entire year or all history

### Accessibility Implementation

#### ARIA Labels

Each DayCell has a comprehensive ARIA label:

```typescript
aria-label={`${format(date, 'MMMM d, yyyy')}${rating ? `, rated as ${mood?.label}` : ', not rated'}${isCurrentDay ? ', today' : ''}${isFutureDate ? ', future date' : ''}`}
```

**Examples**:

- "December 16, 2025, rated as Happy, today"
- "December 1, 2025, not rated"
- "January 3, 2026, future date"

#### Keyboard Navigation

```typescript
role={isClickable ? 'button' : 'gridcell'}
tabIndex={isClickable ? 0 : -1}
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    onDayClick(date)
  }
}}
```

**Behavior**:

- Tab through clickable days only
- Enter or Space activates day
- Future dates are not in tab order

#### Focus Management

```typescript
className={`
  ${isClickable ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' : ''}
`}
```

**Visual**: Clear indigo ring on focus for keyboard users

### API Implementation

#### Month Parameter Validation

```typescript
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/
```

**Valid**: `2025-12`, `2025-01`, `2024-03`
**Invalid**: `25-12` (2-digit year), `2025-13` (invalid month), `2025-1` (missing leading zero)

#### Date Range Calculation

```typescript
const startDate = `${month}-01` // "2025-12-01"

const [year, monthNum] = month.split('-')
const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
const endDate = `${month}-${lastDay.toString().padStart(2, '0')}` // "2025-12-31"
```

**Why this works**:

- `new Date(year, month, 0)` returns last day of previous month
- So `new Date(2025, 12, 0)` = December 31, 2025
- `.getDate()` extracts the day number (28, 29, 30, or 31)

#### Query Optimization

```typescript
select: {
  id: true,
  date: true,
  rating: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
}
```

**Excludes**: `userId` (already known, no need to send back)
**Benefit**: Smaller response payload

### Visual Design Decisions

#### Today Highlighting

```typescript
{isCurrentDay && (
  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
)}
```

**Design**: Small dot in top-right + ring border
**Rationale**: Subtle but clear, doesn't interfere with emoji

#### Future Date Styling

```typescript
${isFutureDate ? 'opacity-40 cursor-not-allowed' : ''}
```

**Design**: 40% opacity + not-allowed cursor
**Rationale**: Clearly disabled, but still visible for context

#### Adjacent Month Dates

```typescript
${!isCurrentMonth ? 'opacity-30' : ''}
```

**Design**: 30% opacity
**Rationale**: Provides context without distraction

#### Emoji Sizing

```typescript
className = 'text-2xl sm:text-3xl'
```

**Design**: Responsive sizing

- Mobile: `text-2xl` (1.5rem / 24px)
- Desktop: `text-3xl` (1.875rem / 30px)

**Rationale**: Larger emojis on desktop where there's more space

## Testing Scenarios

### Unit Testing (Future)

```typescript
describe('DayCell', () => {
  it('renders day number', () => {})
  it('shows emoji for rated day', () => {})
  it('shows empty indicator for unrated day', () => {})
  it('highlights today', () => {})
  it('grays out future dates', () => {})
  it('calls onDayClick when clicked', () => {})
  it('supports keyboard navigation', () => {})
})

describe('Calendar', () => {
  it('generates correct grid for December 2025', () => {})
  it('generates correct grid for February 2024 (leap year)', () => {})
  it('fetches ratings on mount', () => {})
  it('shows loading skeleton', () => {})
  it('displays error banner on API failure', () => {})
  it('converts ratings array to map', () => {})
})
```

### Integration Testing (Future)

```typescript
describe('Calendar API Integration', () => {
  it('fetches and displays ratings for current month', () => {})
  it('handles empty month (no ratings)', () => {})
  it('handles network errors gracefully', () => {})
  it('refetches when month changes', () => {})
})
```

### Manual Testing Checklist

- [ ] Calendar displays current month on load
- [ ] Week starts on Sunday, ends on Saturday
- [ ] Today has indigo ring border
- [ ] Loading skeleton appears while fetching
- [ ] Empty calendar shows small dots for unrated days
- [ ] Rated days show correct emoji (😠 😢 😐 😊)
- [ ] Multiple ratings display correctly
- [ ] Adjacent month dates are dimmed
- [ ] Future dates are grayed out and non-clickable
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces day information
- [ ] Works on mobile (responsive grid)
- [ ] Works in dark mode (dark: classes)

## Known Edge Cases

### 1. Month with 5 weeks vs 6 weeks

**December 2025**: 5 weeks (35 cells)

```
Sun Mon Tue Wed Thu Fri Sat
30  1   2   3   4   5   6
7   8   9   10  11  12  13
14  15  16  17  18  19  20
21  22  23  24  25  26  27
28  29  30  31  1   2   3
```

**May 2025**: 6 weeks (42 cells)

```
Sun Mon Tue Wed Thu Fri Sat
27  28  29  30  1   2   3
4   5   6   7   8   9   10
11  12  13  14  15  16  17
18  19  20  21  22  23  24
25  26  27  28  29  30  31
1   2   3   4   5   6   7
```

**Handling**: Grid automatically adjusts (CSS Grid handles varying cell counts)

### 2. Leap Year February

**February 2024**: 29 days
**February 2025**: 28 days

**Handling**: `endOfMonth` automatically calculates correct last day

### 3. Timezone Considerations

**Issue**: User in timezone UTC-8, server in UTC

- User's "today" = Dec 16, 2025 (local time)
- Server's "today" = Dec 17, 2025 (UTC time)

**Current Behavior**: Uses client-side `isToday()` check
**Future Enhancement**: Consider user timezone preference in database

### 4. Very Long Notes

**Issue**: API returns notes up to 280 characters
**Current Behavior**: Notes not shown in calendar (only in detail modal - US5)
**Rationale**: Calendar cells too small to show text

## Future Enhancements

### User Story 4: Month Navigation

Add these features to Calendar component:

```typescript
const [currentMonth, setCurrentMonth] = useState(new Date())

const goToPreviousMonth = () => {
  setCurrentMonth(subMonths(currentMonth, 1))
}

const goToNextMonth = () => {
  if (!isSameMonth(currentMonth, new Date())) {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
}
```

### User Story 5: Day Detail Modal

Implement `onDayClick` callback:

```typescript
<Calendar
  onDayClick={(date) => {
    setSelectedDate(date)
    setModalOpen(true)
  }}
/>
```

### Potential Improvements

1. **Skeleton Placeholder**: Show skeleton that matches exact grid size (35-42 cells based on month)
2. **Optimistic Updates**: Update calendar UI immediately on rating save, then refetch to confirm
3. **Caching**: Cache month data in React Query or SWR to prevent refetches
4. **Animations**: Fade in rated emojis on load for polish
5. **Week Numbers**: Option to show ISO week numbers on left side
6. **Mini Legends**: Small legend showing emoji meanings

## Dependencies

### NPM Packages

- `date-fns` (^4.1.0): Date manipulation
  - Functions used: `format`, `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `isSameMonth`, `isToday`, `isFuture`
- `react` (^19.2.0): Component framework
- `next` (^16.0.0): App Router, API routes

### Internal Dependencies

- `@/lib/types`: Type definitions
- `@/lib/auth`: NextAuth session management
- `@/lib/db`: Prisma client singleton
- `src/components/DayCell`: Calendar cell component

## Related Documentation

- [Tasks List](../../specs/001-mood-tracking-app/tasks.md) - Tasks T040-T049
- [API Contract](../../API_CONTRACT.md) - Full API documentation
- [Implementation Summary](../../IMPLEMENTATION_US3.md) - High-level overview
- [Type Definitions](../../src/lib/types.ts) - TypeScript types

## Contributors

- Agent B (Initial implementation - US3)
- Agent A (US1 integration - MoodSelector)

---

**Last Updated**: 2025-12-16
**Status**: ✅ Complete and ready for integration
