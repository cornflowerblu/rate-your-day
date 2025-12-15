# Agent Execution Plan: Mood Tracking Application

**Strategy**: Parallel agent execution for maximum efficiency
**Total Agents**: 4 agents working in parallel after foundation
**Estimated Timeline**: 4 phases (sequential foundation, then parallel waves)

---

## Phase 0: Sequential Foundation (You + Claude)

**Duration**: Complete before spawning agents
**Tasks**: T001-T022 (Setup + Foundational)
**Why Sequential**: These tasks create the foundation all agents depend on

### Setup (T001-T010)
- [ ] T001 Initialize Next.js 16 project
- [ ] T002-T010 Configure tooling, dependencies, directory structure

### Foundational (T011-T022) ⚠️ CRITICAL
- [ ] T011-T019 Database, auth, middleware setup
- [ ] T020-T022 PWA manifest and Service Worker

**Checkpoint**: Run `npm run dev`, verify auth works, Prisma connects to Cosmos DB

---

## Phase 1: Parallel Wave 1 (4 Agents)

**Trigger**: After Phase 0 complete
**Strategy**: Spawn 4 agents simultaneously, each working on independent user stories

### Agent A: User Story 1 - Core MVP (T023-T031)
**Priority**: P1 - Highest priority, core feature
**Goal**: Quick daily mood rating functionality
**Tasks**: 9 tasks
**Files**:
- `src/components/MoodSelector.tsx`
- `src/app/api/ratings/[date]/route.ts`
- `src/app/page.tsx`

**Independent Test**: Load app, tap emoji, verify rating persists after reload

**Spawn Command**:
```
Task: "Implement User Story 1 (Quick Daily Mood Rating) - Tasks T023 through T031.
Create MoodSelector component, API routes for ratings (GET/POST), integrate into page.tsx.
Focus on immediate save, visual feedback, and error handling.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

### Agent B: User Story 3 - Calendar View (T040-T049)
**Priority**: P2 - High value, independent of US1
**Goal**: Monthly calendar view showing mood patterns
**Tasks**: 10 tasks
**Files**:
- `src/components/Calendar.tsx`
- `src/components/DayCell.tsx`
- `src/app/api/ratings/route.ts`

**Independent Test**: Create multiple ratings, verify calendar displays correctly

**Spawn Command**:
```
Task: "Implement User Story 3 (View Monthly Mood Patterns) - Tasks T040 through T049.
Create Calendar and DayCell components, API route for month queries (GET /api/ratings?month=YYYY-MM).
Use date-fns for calendar grid generation. Show emojis on rated days, highlight today, gray out future.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

### Agent C: User Story 6 - Push Notifications (T068-T078)
**Priority**: P3 - Independent, can work in parallel
**Goal**: Daily 9 PM reminders via push notifications
**Tasks**: 11 tasks
**Files**:
- `src/lib/push.ts`
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/unsubscribe/route.ts`
- `azure-functions/daily-reminder/`

**Independent Test**: Grant permission, trigger Azure Function, verify notification sends

**Spawn Command**:
```
Task: "Implement User Story 6 (Receive Daily Reminder) - Tasks T068 through T078.
Create push notification helpers, API routes for subscribe/unsubscribe, Azure Function Timer Trigger for 9 PM CST.
Use web-push library with VAPID keys. Handle permission requests and notification clicks.
Refer to specs/001-mood-tracking-app/tasks.md and research.md for implementation patterns."
```

---

### Agent D: User Story 7 - Offline Support (T079-T089)
**Priority**: P4 - Independent, PWA enhancement
**Goal**: Offline functionality with automatic sync
**Tasks**: 11 tasks
**Files**:
- `src/lib/offline-db.ts`
- `src/components/OfflineIndicator.tsx`
- `public/sw.js` (enhance existing)

**Independent Test**: Disconnect internet, rate day, reconnect, verify auto-sync

**Spawn Command**:
```
Task: "Implement User Story 7 (Offline Mood Tracking) - Tasks T079 through T089.
Create offline database wrapper using idb library, offline indicator component.
Implement IndexedDB pending queue and Background Sync in Service Worker.
Handle offline/online detection and automatic syncing when connection restored.
Refer to specs/001-mood-tracking-app/tasks.md and research.md for offline patterns."
```

---

## Coordination: Wave 1 Execution

### How to Spawn Agents in Parallel

Use a single message with multiple Task tool calls:

```
Launch 4 agents in parallel to implement independent user stories after foundation is complete.
Each agent should work independently and report when done.
```

Then call Task tool 4 times in parallel (single message, multiple tool uses):
- Agent A: US1 tasks
- Agent B: US3 tasks
- Agent C: US6 tasks
- Agent D: US7 tasks

### Integration After Wave 1

Once all 4 agents complete:
1. Review each agent's work
2. Test each user story independently
3. Merge all changes
4. Verify no conflicts (different files = minimal conflicts)
5. Test integrated app

**Expected State**: US1, US3, US6, US7 all functional

---

## Phase 2: Parallel Wave 2 (4 Agents)

**Trigger**: After Wave 1 complete and integrated
**Dependencies**: US3 must be complete before US4 and US5

### Agent A: User Story 2 - Notes (T032-T039)
**Priority**: P2 - Builds on US1
**Goal**: Add notes to daily ratings with auto-save
**Tasks**: 8 tasks
**Files**:
- `src/components/NotesInput.tsx`
- Update `src/app/page.tsx`
- Update `src/app/api/ratings/[date]/route.ts`

**Spawn Command**:
```
Task: "Implement User Story 2 (Add Context Notes) - Tasks T032 through T039.
Create NotesInput component with character counter and debounced auto-save.
Update API route to accept notes field. Add 280 character limit with validation.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

### Agent B: User Story 4 - Month Navigation (T050-T057)
**Prerequisites**: ⚠️ Requires US3 (Calendar component) complete
**Goal**: Navigate between months
**Tasks**: 8 tasks
**Files**:
- Update `src/components/Calendar.tsx`

**Spawn Command**:
```
Task: "Implement User Story 4 (Navigate Historical Data) - Tasks T050 through T057.
Add month navigation to existing Calendar component (previous/next buttons).
Implement navigation logic with future month prevention. Update month/year label.
Requires Calendar component from US3 to be complete.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

### Agent C: User Story 5 - Edit Past Days (T058-T067)
**Prerequisites**: ⚠️ Requires US3 (Calendar component) complete
**Goal**: View and edit past day details via modal
**Tasks**: 10 tasks
**Files**:
- `src/components/DayDetailModal.tsx`
- `src/app/api/ratings/[date]/route.ts` (add DELETE)
- Update `src/components/DayCell.tsx`

**Spawn Command**:
```
Task: "Implement User Story 5 (Review and Edit Past Days) - Tasks T058 through T067.
Create DayDetailModal component for editing past days. Add DELETE API route.
Integrate with DayCell click handler. Support editing rating and notes from modal.
Requires Calendar and DayCell components from US3 to be complete.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

### Agent D: User Story 8 - PWA Install (T090-T097)
**Priority**: P4 - Independent, final PWA enhancement
**Goal**: Enable app installation
**Tasks**: 8 tasks
**Files**:
- Update `src/app/manifest.ts`
- Update `src/app/layout.tsx`
- Update `public/sw.js`

**Spawn Command**:
```
Task: "Implement User Story 8 (Install as Standalone App) - Tasks T090 through T097.
Configure manifest for proper install experience. Add theme color meta tags.
Test install prompt, standalone mode, and icons across browsers.
Refer to specs/001-mood-tracking-app/tasks.md for detailed task list."
```

---

## Coordination: Wave 2 Execution

### Spawn Order

**First**: Wait for US3 completion from Wave 1

**Then spawn 4 agents**:
- Agent A: US2 (independent)
- Agent B: US4 (depends on US3 - now available)
- Agent C: US5 (depends on US3 - now available)
- Agent D: US8 (independent)

### Integration After Wave 2

Once all 4 agents complete:
1. Review each agent's work
2. Test each user story independently
3. Merge all changes
4. Full integration test

**Expected State**: All 8 user stories functional

---

## Phase 3: Polish (You + Claude or Single Agent)

**Trigger**: After Wave 2 complete
**Tasks**: T098-T115 (18 tasks)
**Strategy**: Sequential or semi-parallel

### Polish Groups

**Group 1: Accessibility (T098-T102)** - Can parallelize
- ARIA labels, keyboard navigation, color contrast, screen readers

**Group 2: E2E Tests (T103-T105)** - Can parallelize
- Rating flow, calendar, offline tests with Playwright

**Group 3: Performance (T106-T109)** - Can parallelize
- Lighthouse audit, bundle optimization, error boundaries

**Group 4: Deployment (T110-T115)** - Sequential
- Vercel config, production deploy, Azure Functions deploy, validation

---

## Agent Coordination Best Practices

### Before Spawning Agents

1. **Complete foundation**: Verify T001-T022 fully working
2. **Commit baseline**: `git commit -m "Foundation complete - ready for parallel work"`
3. **Create tracking branches** (optional):
   ```bash
   git checkout -b agent-a-us1
   git checkout main
   git checkout -b agent-b-us3
   # etc.
   ```

### During Agent Execution

1. **Monitor progress**: Check agent status periodically
2. **Use TaskOutput** to retrieve results when agents complete
3. **Review code**: Each agent's output before merging
4. **Test independently**: Verify each user story works standalone

### After Agent Completion

1. **Merge sequentially**: Start with highest priority (US1)
2. **Resolve conflicts**: Minimal expected (different files)
3. **Integration test**: Verify all stories work together
4. **Create PR**: One comprehensive PR or separate PRs per story

---

## Example: Spawning Wave 1 Agents

Use a single message with 4 Task tool calls:

```markdown
I'm ready to launch 4 agents to work on user stories in parallel.
Foundation is complete (T001-T022). Each agent should work independently.
```

Then invoke Task tool 4 times in one message:
1. Agent A: US1 (T023-T031)
2. Agent B: US3 (T040-T049)
3. Agent C: US6 (T068-T078)
4. Agent D: US7 (T079-T089)

**Wait for all 4 to complete**, then integrate.

---

## Expected Timeline

**Phase 0**: 2-4 hours (Sequential foundation)
**Wave 1**: 1-2 hours (4 agents in parallel)
**Integration 1**: 30 mins
**Wave 2**: 1-2 hours (4 agents in parallel)
**Integration 2**: 30 mins
**Polish**: 2-3 hours (Sequential or semi-parallel)

**Total**: ~8-12 hours vs. ~24-30 hours sequential

---

## Risk Mitigation

### Potential Issues

1. **Merge conflicts**: Different agents editing same file
   - **Mitigation**: User stories designed with file isolation
   - **Reality**: Minimal conflicts expected (different components)

2. **Integration bugs**: Stories work alone but not together
   - **Mitigation**: Independent tests verify each story
   - **Solution**: Integration testing phase after each wave

3. **Agent dependencies**: One agent blocks another
   - **Mitigation**: Wave 1 has zero dependencies
   - **Wave 2**: US3 dependency handled by sequencing waves

### Rollback Strategy

If an agent produces broken code:
1. Don't merge that agent's work
2. Fix manually or re-spawn agent with corrections
3. Other agents' work unaffected (independent)

---

## Success Metrics

**After Wave 1**:
- ✓ US1: Can rate day (MVP functional)
- ✓ US3: Can view calendar
- ✓ US6: Can receive notifications
- ✓ US7: Can work offline

**After Wave 2**:
- ✓ US2: Can add notes
- ✓ US4: Can navigate months
- ✓ US5: Can edit past days
- ✓ US8: Can install as app

**After Polish**:
- ✓ Accessible (WCAG AA)
- ✓ E2E tested
- ✓ Deployed to Vercel
- ✓ Production ready

---

## Ready to Execute?

**Next Steps**:

1. **Complete foundation now** (T001-T022)
2. **Commit and verify** everything works
3. **Tell me when ready** to spawn Wave 1 agents
4. **I'll launch 4 agents in parallel** with the commands above
5. **Monitor and integrate** as agents complete

Let's start with Phase 0 (foundation) - are you ready to begin?
