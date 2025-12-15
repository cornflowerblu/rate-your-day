# CLAUDE.md - Project Guide for rate-your-day

## Project Overview

Rate Your Day is a mood tracking application where users rate their daily experience using an emoji-based scale. The app displays the current day's rating selection and provides a calendar view showing historical ratings across the month, with optional notes for each entry.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development) / Azure PostgreSQL (production)
- **Deployment**: Azure Container Apps (serverless)
- **ORM**: Prisma

### Why Next.js over Flask?

- Single codebase for frontend + API (faster development)
- Built-in responsive design patterns with React
- Excellent TypeScript support
- Simpler deployment pipeline
- Rich ecosystem for calendar/date components

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Database migrations
npx prisma migrate dev
npx prisma generate
```

## Project Structure

```
rate-your-day/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Home - today's rating + calendar
│   │   ├── layout.tsx       # Root layout
│   │   └── api/             # API routes
│   │       └── ratings/     # Rating CRUD endpoints
│   ├── components/
│   │   ├── MoodSelector.tsx # Emoji rating selector
│   │   ├── Calendar.tsx     # Monthly calendar view
│   │   ├── DayCell.tsx      # Individual calendar day
│   │   └── NotesInput.tsx   # Notes text field
│   ├── lib/
│   │   ├── db.ts            # Database client
│   │   └── types.ts         # TypeScript types
│   └── styles/
│       └── globals.css      # Global styles + Tailwind
├── prisma/
│   └── schema.prisma        # Database schema
├── public/
│   └── icons/               # Mood emoji assets
├── tests/
├── Dockerfile
├── package.json
└── tailwind.config.ts
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

## Data Model

```typescript
interface DayRating {
  id: string;
  date: string;        // ISO date (YYYY-MM-DD)
  rating: 1 | 2 | 3 | 4;  // angry=1, sad=2, average=3, happy=4
  notes?: string;      // optional, max 280 chars
  createdAt: DateTime;
  updatedAt: DateTime;
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
DATABASE_URL=           # Database connection string
NEXT_PUBLIC_APP_URL=    # Public app URL
```

## Deployment (Azure)

Target: Azure Container Apps (serverless containers)
- Auto-scaling based on HTTP traffic
- Built-in HTTPS
- Easy CI/CD with GitHub Actions

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database: `npx prisma migrate dev`
4. Start development server: `npm run dev`
5. Open http://localhost:3000
