# Rate Your Day - Product Specification

## Vision

A simple, delightful mood tracking app that lets users quickly rate their day with a single tap and reflect on their emotional patterns over time.

## Target Users

### v1: Single User (Owner)
- Personal mood tracking app
- Authenticated via Microsoft Entra ID (SSO)
- No registration required - owner's Microsoft account only

### Future: Public Users
- Open registration via Firebase Auth
- Multi-user support with data isolation
- See authentication roadmap in CLAUDE.md

## User Stories

### Core Rating Flow

**US-1: Rate Today**
> As a user, I want to rate my day by tapping an emoji face so that I can quickly log how I'm feeling.

Acceptance Criteria:
- [ ] Four emoji options displayed horizontally: 😠 😢 😐 😊
- [ ] Tapping an emoji selects it with clear visual feedback
- [ ] Selection is immediately saved
- [ ] Can change selection by tapping a different emoji
- [ ] Works with single tap on mobile, single click on desktop

**US-2: Add Notes**
> As a user, I want to add a short note to my daily rating so that I can remember context about my day.

Acceptance Criteria:
- [ ] Text input field below mood selector
- [ ] Maximum 280 characters
- [ ] Character count indicator
- [ ] Auto-saves when user stops typing (debounced)
- [ ] Notes are optional

**US-3: View Today's Status**
> As a user, I want to see today's date and my current rating so that I know if I've already rated today.

Acceptance Criteria:
- [ ] Today's date displayed prominently
- [ ] If rated: show selected emoji highlighted
- [ ] If not rated: show prompt "How was your day?"
- [ ] Show existing notes if any

### Calendar View

**US-4: View Monthly Calendar**
> As a user, I want to see a calendar view of the current month so that I can see my mood patterns.

Acceptance Criteria:
- [ ] Standard month grid layout (Sun-Sat or Mon-Sun configurable)
- [ ] Each day shows the mood emoji if rated
- [ ] Unrated days show empty/neutral state
- [ ] Today is visually highlighted
- [ ] Future dates are visually distinct (grayed)

**US-5: Navigate Months**
> As a user, I want to navigate to previous months so that I can review historical data.

Acceptance Criteria:
- [ ] Previous/Next month navigation arrows
- [ ] Month and year displayed (e.g., "December 2025")
- [ ] Can navigate to any past month with data
- [ ] Cannot navigate to future months

**US-6: View Past Day Details**
> As a user, I want to tap on a past day to see its rating and notes so that I can review what happened.

Acceptance Criteria:
- [ ] Tapping a past day opens detail view
- [ ] Shows date, rating emoji, and notes
- [ ] Can edit rating and notes for past days
- [ ] Close/dismiss to return to calendar

## UI Components

### MoodSelector
```
┌──────────────────────────────────────┐
│         How was your day?            │
│                                      │
│    😠      😢      😐      😊       │
│   Angry   Sad   Average  Happy       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Add a note... (optional)       │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                            0/280     │
└──────────────────────────────────────┘
```

### Calendar View
```
┌──────────────────────────────────────┐
│     <  December 2025  >              │
│                                      │
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat   │
│        1    2    3    4    5    6    │
│       😊   😐   😢   😊   😊   😐   │
│                                      │
│   7    8    9   10   11   12   13    │
│  😊   😐   😢   😊   😊   [14]  --   │
│                                      │
│  ...                                 │
└──────────────────────────────────────┘
```

## Technical Requirements

### Performance
- Initial page load: < 2 seconds
- Interaction response: < 100ms visual feedback
- Auto-save latency: < 500ms

### Accessibility
- All interactive elements keyboard accessible
- ARIA labels on emoji buttons (e.g., "Rate as happy")
- Sufficient color contrast (WCAG AA)
- Screen reader compatible

### Browser Support
- Chrome (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 10+)

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

## Data Requirements

### Authentication
- Microsoft Entra ID (Azure AD) for SSO
- Single authorized user (owner's Microsoft account)
- Protected routes - all pages require authentication
- Session managed via `next-auth`

### Storage
- Cloud-first with PostgreSQL (Azure)
- SQLite for local development
- Data retention: indefinite
- All data tied to authenticated user

### Privacy
- No personal data collected beyond ratings and notes
- Data stored in Azure (owner's tenant)
- Microsoft account email used for user identification
- No third-party data sharing

## Out of Scope (v1)

- Public user registration (Firebase Auth - future)
- Multi-user support
- Data export
- Mood analytics/insights
- Push notifications/reminders
- Sharing functionality
- Custom emoji sets
- Weekly/yearly views

## Open Questions

1. **Week start day**: Should calendar start on Sunday or Monday? (Make configurable?)
2. **Timezone handling**: How to handle users who travel across timezones?
3. **Edit history**: Should we track when ratings are modified?
4. **Offline support**: PWA with offline capability in v1 or defer?

## Success Metrics

- User can rate their day in < 3 seconds
- User can view past month's data in < 2 taps/clicks
- App loads and is interactive in < 2 seconds
- Zero data loss incidents

## Milestones

### M0: Project Setup
- Next.js 16 project initialization
- Entra ID authentication with next-auth
- Prisma schema and database setup
- Basic protected route structure

### M1: Core Rating
- Today's view with mood selector
- Notes input
- Save to PostgreSQL database

### M2: Calendar View
- Monthly calendar display
- Navigate between months
- View past day details

### M3: Polish & Deploy
- Responsive design finalization
- Accessibility audit
- Azure deployment (AKS or Container Apps)
- Performance optimization
