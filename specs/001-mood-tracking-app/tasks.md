# Tasks: Mood Tracking Application

**Input**: Design documents from `/specs/001-mood-tracking-app/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: NOT included - specification does not request TDD approach. E2E tests will be added in Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Using Next.js App Router structure from plan.md:

- Frontend & API: `src/app/`, `src/components/`, `src/lib/`
- Database: `prisma/schema.prisma`
- Tests: `tests/e2e/`, `tests/components/`
- Azure Functions: `azure-functions/daily-reminder/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 16 project with TypeScript 5.1+ and App Router in root directory
- [x] T002 [P] Configure Tailwind CSS 4.0 in tailwind.config.ts
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T004 [P] Setup ESLint and Prettier in .eslintrc.json and .prettierrc
- [x] T005 [P] Create environment variables template in .env.local.example
- [x] T006 [P] Configure next.config.js with PWA settings (next-pwa plugin)
- [x] T007 [P] Install core dependencies (next-auth, prisma, date-fns, web-push, idb, use-debounce)
- [x] T008 Create project directory structure (src/app, src/components, src/lib, prisma, public, tests)
- [x] T009 [P] Create PWA icons in public/icons/ (192x192, 512x512)
- [x] T010 [P] Setup Git hooks with Husky for pre-commit linting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create Prisma schema with DayRating and PushSubscription models in prisma/schema.prisma
- [x] T012 Initialize Prisma client singleton in src/lib/db.ts
- [x] T013 Setup NextAuth.js configuration with Azure AD provider in src/lib/auth.ts
- [x] T014 Create NextAuth API route in src/app/api/auth/[...nextauth]/route.ts
- [x] T015 Implement authentication middleware for route protection in src/middleware.ts
- [x] T016 Create root layout with authentication provider in src/app/layout.tsx
- [x] T017 Create global styles and Tailwind imports in src/styles/globals.css
- [x] T018 Create TypeScript types for DayRating and PushSubscription in src/lib/types.ts
- [x] T019 Setup Cosmos DB connection and run npx prisma db push
- [x] T020 [P] Create PWA Web App Manifest in src/app/manifest.ts
- [x] T021 [P] Create basic Service Worker in public/sw.js with Workbox caching
- [x] T022 [P] Create offline fallback page in public/offline.html

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Daily Mood Rating (Priority: P1) 🎯 MVP

**Goal**: Allow users to rate their day with one of four emoji faces (angry, sad, average, happy) in under 3 seconds

**Independent Test**: Load app, tap an emoji, verify rating is saved and persists after page reload

### Implementation for User Story 1

- [x] T023 [P] [US1] Create MoodSelector component in src/components/MoodSelector.tsx
- [x] T024 [P] [US1] Create API route GET /api/ratings/[date] in src/app/api/ratings/[date]/route.ts
- [x] T025 [US1] Create API route POST /api/ratings/[date] for upserting ratings in src/app/api/ratings/[date]/route.ts
- [x] T026 [US1] Implement today's date display and rating view in src/app/page.tsx
- [x] T027 [US1] Add immediate save logic on emoji click in MoodSelector component
- [x] T028 [US1] Add visual feedback for selected emoji (highlight state)
- [x] T029 [US1] Implement rating change functionality (tap different emoji)
- [x] T030 [US1] Add loading state while saving rating
- [x] T031 [US1] Add error handling for failed saves with user feedback

**Checkpoint**: At this point, User Story 1 should be fully functional - users can rate their day and see the rating persist

---

## Phase 4: User Story 2 - Add Context Notes (Priority: P2)

**Goal**: Allow users to add optional notes (max 280 characters) to their daily rating with auto-save

**Independent Test**: Select a mood rating, type a note, verify it auto-saves after 1 second and persists

### Implementation for User Story 2

- [x] T032 [P] [US2] Create NotesInput component with character counter in src/components/NotesInput.tsx
- [x] T033 [US2] Implement debounced auto-save hook using use-debounce in NotesInput
- [x] T034 [US2] Update POST /api/ratings/[date] to accept notes field
- [x] T035 [US2] Add notes field to today's page view in src/app/page.tsx below MoodSelector
- [x] T036 [US2] Implement 280 character limit with input validation
- [x] T037 [US2] Add character count display (e.g., "45/280")
- [x] T038 [US2] Add visual feedback during auto-save (e.g., "Saving..." indicator)
- [x] T039 [US2] Handle paste events that exceed 280 characters (truncate)

**Checkpoint**: Users can now add notes to their ratings with automatic saving

---

## Phase 5: User Story 3 - View Monthly Mood Patterns (Priority: P2)

**Goal**: Display a calendar view showing all ratings for the current month in a Sunday-Saturday grid

**Independent Test**: Create multiple ratings across different days, verify they display correctly in the calendar with proper emoji rendering

### Implementation for User Story 3

- [x] T040 [P] [US3] Create Calendar component in src/components/Calendar.tsx
- [x] T041 [P] [US3] Create DayCell component for individual calendar days in src/components/DayCell.tsx
- [x] T042 [P] [US3] Create API route GET /api/ratings?month=YYYY-MM in src/app/api/ratings/route.ts
- [x] T043 [US3] Implement calendar grid generation using date-fns (eachDayOfInterval, startOfMonth, endOfMonth)
- [x] T044 [US3] Add calendar to page below today's rating in src/app/page.tsx
- [x] T045 [US3] Implement emoji rendering on rated days in DayCell
- [x] T046 [US3] Add empty/neutral state for unrated days
- [x] T047 [US3] Implement today highlighting in calendar grid
- [x] T048 [US3] Add visual distinction for future dates (grayed out, non-interactive)
- [x] T049 [US3] Add month and year label display (e.g., "December 2025")

**Checkpoint**: Users can now see their mood patterns in a monthly calendar view

---

## Phase 6: User Story 4 - Navigate Historical Data (Priority: P3)

**Goal**: Allow users to navigate between months to view historical mood data

**Independent Test**: Navigate to previous month, verify past ratings display; navigate forward, verify navigation stops at current month

### Implementation for User Story 4

- [x] T050 [US4] Add month navigation state management in Calendar component
- [x] T051 [US4] Create previous month button in Calendar component
- [x] T052 [US4] Create next month button in Calendar component
- [x] T053 [US4] Implement previous month navigation logic (update month state, fetch ratings)
- [x] T054 [US4] Implement next month navigation logic with future month prevention
- [x] T055 [US4] Update month/year label when navigating
- [x] T056 [US4] Add loading state during month data fetching
- [x] T057 [US4] Disable next button when on current month

**Checkpoint**: Users can browse their historical mood data across any past month

---

## Phase 7: User Story 5 - Review and Edit Past Days (Priority: P3)

**Goal**: Allow users to tap on past rated days to view details and edit rating or notes

**Independent Test**: Tap a past rated day, verify modal opens with correct data; edit rating/notes, verify changes save and reflect in calendar

### Implementation for User Story 5

- [x] T058 [P] [US5] Create DayDetailModal component in src/components/DayDetailModal.tsx
- [x] T059 [P] [US5] Create API route DELETE /api/ratings/[date] in src/app/api/ratings/[date]/route.ts
- [x] T060 [US5] Add click handler to DayCell for rated days
- [x] T061 [US5] Implement modal open/close state management
- [x] T062 [US5] Display selected day's date, rating, and notes in modal
- [x] T063 [US5] Add MoodSelector to modal for editing rating
- [x] T064 [US5] Add NotesInput to modal for editing notes
- [x] T065 [US5] Implement save on rating/notes change in modal
- [x] T066 [US5] Add close/dismiss button to return to calendar
- [x] T067 [US5] Update calendar display when modal closes (refresh ratings)

**Checkpoint**: Users can review and edit any past day's rating and notes

---

## Phase 8: User Story 6 - Receive Daily Reminder (Priority: P3)

**Goal**: Send push notification at 9 PM CST if user hasn't rated today

**Independent Test**: Grant push permission, wait until 9 PM on unrated day, verify notification appears; tap notification, verify app opens to today's view

### Implementation for User Story 6

- [x] T068 [P] [US6] Create push notification helper functions in src/lib/push.ts
- [x] T069 [P] [US6] Create API route POST /api/push/subscribe in src/app/api/push/subscribe/route.ts
- [x] T070 [P] [US6] Create API route POST /api/push/unsubscribe in src/app/api/push/unsubscribe/route.ts
- [x] T071 [P] [US6] Create Azure Function Timer Trigger in azure-functions/daily-reminder/function.json
- [x] T072 [US6] Implement Azure Function logic to check for unrated days in azure-functions/daily-reminder/index.ts
- [x] T073 [US6] Add permission request UI component in src/app/page.tsx
- [x] T074 [US6] Implement client-side subscription logic (register service worker, subscribe to push)
- [x] T075 [US6] Store push subscription in database via /api/push/subscribe
- [x] T076 [US6] Implement notification sending in Azure Function using web-push
- [x] T077 [US6] Add notification click handler in Service Worker to open app
- [ ] T078 [US6] Test notification at 9 PM CST (2 AM UTC) using Timer Trigger schedule

**Checkpoint**: Users receive daily reminders and can tap to rate their day

---

## Phase 9: User Story 7 - Offline Mood Tracking (Priority: P4)

**Goal**: Allow users to rate days and view data when offline, with automatic sync when back online

**Independent Test**: Disconnect internet, rate a day, verify saved locally; reconnect, verify syncs automatically

### Implementation for User Story 7

- [ ] T079 [P] [US7] Create OfflineIndicator component in src/components/OfflineIndicator.tsx
- [ ] T080 [P] [US7] Create IndexedDB wrapper using idb library in src/lib/offline-db.ts
- [ ] T081 [US7] Add offline/online detection in src/app/page.tsx
- [ ] T082 [US7] Implement pending ratings queue in IndexedDB (pending-ratings store)
- [ ] T083 [US7] Update MoodSelector to save to IndexedDB when offline
- [ ] T084 [US7] Update NotesInput to save to IndexedDB when offline
- [ ] T085 [US7] Add Background Sync registration in Service Worker
- [ ] T086 [US7] Implement sync event handler in Service Worker (public/sw.js)
- [ ] T087 [US7] Add retry logic for failed syncs with exponential backoff
- [ ] T088 [US7] Update UI to show offline indicator when disconnected
- [ ] T089 [US7] Add success feedback when offline changes sync

**Checkpoint**: Users can use the app fully offline with automatic syncing

---

## Phase 10: User Story 8 - Install as Standalone App (Priority: P4)

**Goal**: Allow users to install the app on their device like a native app

**Independent Test**: Visit app in browser, install via "Add to Home Screen", verify launches standalone with correct icon

### Implementation for User Story 8

- [ ] T090 [US8] Configure manifest.ts with correct name, icons, and standalone display
- [ ] T091 [US8] Add theme color meta tag in src/app/layout.tsx
- [ ] T092 [US8] Configure Service Worker for install prompt
- [ ] T093 [US8] Test install prompt on Chrome (desktop and mobile)
- [ ] T094 [US8] Test install on Safari (iOS 15+)
- [ ] T095 [US8] Verify standalone mode (no browser chrome)
- [ ] T096 [US8] Verify app icon displays correctly on home screen
- [ ] T097 [US8] Test all functionality in installed app mode

**Checkpoint**: Users can install and use the app as a standalone application

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final testing, and deployment preparation

- [ ] T098 [P] Add ARIA labels to all interactive elements (MoodSelector, Calendar, buttons)
- [ ] T099 [P] Implement keyboard navigation for MoodSelector (arrow keys, Enter)
- [ ] T100 [P] Verify WCAG AA color contrast across all components
- [ ] T101 [P] Add screen reader announcements for rating changes
- [ ] T102 [P] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] T103 Create E2E test for rating flow in tests/e2e/rating-flow.spec.ts
- [ ] T104 [P] Create E2E test for calendar view in tests/e2e/calendar.spec.ts
- [ ] T105 [P] Create E2E test for offline functionality in tests/e2e/offline.spec.ts
- [ ] T106 Run Lighthouse audit and optimize performance to meet < 2s load time
- [ ] T107 [P] Optimize bundle size (tree-shaking, code splitting)
- [ ] T108 [P] Add error boundaries for graceful error handling
- [ ] T109 [P] Add analytics events (optional, if tracking desired)
- [ ] T110 Configure Vercel environment variables (DATABASE*URL, NEXTAUTH_SECRET, AZURE_AD*\_, VAPID\_\_)
- [ ] T111 Deploy to Vercel and verify production build
- [ ] T112 Deploy Azure Function to Azure Functions App
- [ ] T113 Test end-to-end in production environment
- [ ] T114 Run quickstart.md validation (verify setup instructions work)
- [ ] T115 Update README.md with deployment status and live URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✓ INDEPENDENT
- **User Story 2 (P2)**: Can start after Foundational - Builds on US1 components but independently testable ✓ INDEPENDENT
- **User Story 3 (P2)**: Can start after Foundational - No dependencies on US1 or US2 ✓ INDEPENDENT
- **User Story 4 (P3)**: Depends on US3 completion (requires Calendar component) ⚠️ DEPENDS ON US3
- **User Story 5 (P3)**: Depends on US3 completion (requires Calendar component) ⚠️ DEPENDS ON US3
- **User Story 6 (P3)**: Can start after Foundational - No dependencies on other stories ✓ INDEPENDENT
- **User Story 7 (P4)**: Can start after Foundational - Works with US1 components but independently testable ✓ INDEPENDENT
- **User Story 8 (P4)**: Can start after Foundational - No dependencies on other stories ✓ INDEPENDENT

### Within Each User Story

- API routes before component integration
- Components before page integration
- Core functionality before edge case handling
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1):**

- T002, T003, T004, T005, T006, T007, T009, T010 can run in parallel

**Foundational Phase (Phase 2):**

- T020, T021, T022 can run in parallel (PWA setup)
- T011-T019 must run sequentially (database and auth setup)

**User Story 1:**

- T023, T024 can run in parallel (component and API route)

**User Story 2:**

- T032, T033, T034 can run in parallel initially

**User Story 3:**

- T040, T041, T042 can run in parallel (components and API route)

**User Story 5:**

- T058, T059 can run in parallel (modal component and delete API)

**User Story 6:**

- T068, T069, T070, T071 can run in parallel (different files)

**User Story 7:**

- T079, T080 can run in parallel (indicator and offline DB)

**Polish Phase:**

- T098-T102 (accessibility) can run in parallel
- T103-T105 (E2E tests) can run in parallel
- T107, T108, T109 can run in parallel

**Full Parallelization (if team has capacity):**
After Foundational phase completes, these user stories can start in parallel:

- US1 (P1)
- US2 (P2)
- US3 (P2)
- US6 (P3) - Push notifications
- US7 (P4) - Offline support
- US8 (P4) - PWA install

Then after US3 completes:

- US4 (P3) - Month navigation
- US5 (P3) - Edit past days

---

## Parallel Example: User Story 1

```bash
# Launch these tasks together for US1:
Task T023: "Create MoodSelector component in src/components/MoodSelector.tsx"
Task T024: "Create API route GET /api/ratings/[date] in src/app/api/ratings/[date]/route.ts"

# Both work on different files, no dependencies
```

---

## Parallel Example: Multiple User Stories

```bash
# After Foundational phase, launch these user stories in parallel:
Team Member A: US1 (T023-T031) - Quick Daily Mood Rating
Team Member B: US3 (T040-T049) - View Monthly Mood Patterns
Team Member C: US6 (T068-T078) - Receive Daily Reminder
Team Member D: US7 (T079-T089) - Offline Mood Tracking

# All are independent and can proceed simultaneously
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T022) - CRITICAL
3. Complete Phase 3: User Story 1 (T023-T031)
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy to Vercel and demo

**MVP Scope**: Just P1 delivers core value - users can rate their day in under 3 seconds

### Incremental Delivery (Recommended)

1. Setup + Foundational → Foundation ready (T001-T022)
2. Add US1 → Test independently → Deploy/Demo (T023-T031) **MVP!**
3. Add US2 → Test independently → Deploy/Demo (T032-T039)
4. Add US3 → Test independently → Deploy/Demo (T040-T049)
5. Add US4 → Test independently → Deploy/Demo (T050-T057)
6. Add US5 → Test independently → Deploy/Demo (T058-T067)
7. Add US6 → Test independently → Deploy/Demo (T068-T078)
8. Add US7 → Test independently → Deploy/Demo (T079-T089)
9. Add US8 → Test independently → Deploy/Demo (T090-T097)
10. Polish → Final production release (T098-T115)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With 3-4 developers:

1. **Week 1**: Team completes Setup + Foundational together (T001-T022)
2. **Week 2**: Once Foundational is done:
   - Dev A: US1 (T023-T031)
   - Dev B: US3 (T040-T049)
   - Dev C: US6 (T068-T078)
   - Dev D: US7 (T079-T089)
3. **Week 3**:
   - Dev A: US2 (T032-T039)
   - Dev B: US4 (T050-T057) after US3
   - Dev C: US5 (T058-T067) after US3
   - Dev D: US8 (T090-T097)
4. **Week 4**: Team completes Polish together (T098-T115)

Stories complete and integrate independently.

---

## Task Count Summary

- **Total Tasks**: 115
- **Setup Phase**: 10 tasks
- **Foundational Phase**: 12 tasks (BLOCKING)
- **User Story 1 (P1)**: 9 tasks - MVP
- **User Story 2 (P2)**: 8 tasks
- **User Story 3 (P2)**: 10 tasks
- **User Story 4 (P3)**: 8 tasks
- **User Story 5 (P3)**: 10 tasks
- **User Story 6 (P3)**: 11 tasks
- **User Story 7 (P4)**: 11 tasks
- **User Story 8 (P4)**: 8 tasks
- **Polish Phase**: 18 tasks

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel within their phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = Just User Story 1 (9 tasks after foundation)
- Full v1 = All 8 user stories (115 tasks total)
