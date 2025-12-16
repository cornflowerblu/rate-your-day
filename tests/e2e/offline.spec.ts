import { test, expect } from '@playwright/test'

/**
 * E2E tests for offline functionality
 *
 * Tests PWA offline support, caching, and background sync
 */

test.describe('Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and wait for service worker to register
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for service worker to be ready
    await page.waitForTimeout(2000)
  })

  test('should register service worker', async ({ page }) => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.ready.then(() => true)
    })

    expect(swRegistered).toBe(true)
  })

  test('should display offline indicator when network is offline', async ({ page, context }) => {
    // Simulate going offline
    await context.setOffline(true)

    // Wait for offline indicator to appear
    await page.waitForTimeout(1000)

    // Verify offline indicator is visible
    const offlineIndicator = page.getByText(/offline|no connection/i)
    await expect(offlineIndicator).toBeVisible()
  })

  test('should hide offline indicator when network is back online', async ({ page, context }) => {
    // Go offline first
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // Verify offline indicator is visible
    const offlineIndicator = page.getByText(/offline|no connection/i)
    await expect(offlineIndicator).toBeVisible()

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(1000)

    // Verify offline indicator disappears
    await expect(offlineIndicator).not.toBeVisible()
  })

  test('should allow rating while offline and queue for sync', async ({ page, context }) => {
    // Select a mood while online first to ensure the page works
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // Change mood while offline
    const sadButton = page.getByRole('button', { name: /rate your day as sad/i })
    await sadButton.click()
    await page.waitForTimeout(1000)

    // Verify button shows pressed state (optimistic update)
    await expect(sadButton).toHaveAttribute('aria-pressed', 'true')

    // Verify "saved offline" message appears
    const offlineMessage = page.getByText(/saved offline|will sync/i)
    await expect(offlineMessage).toBeVisible()
  })

  test('should persist cached data after going offline', async ({ page, context }) => {
    // Rate while online
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    await averageButton.click()
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Reload page while offline
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify the cached rating is still displayed
    await expect(averageButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should load app shell from cache when offline', async ({ page, context }) => {
    // First visit ensures everything is cached
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Navigate to a new page (simulating app restart)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Verify main UI elements are visible (loaded from cache)
    const heading = page.getByRole('heading', { name: /rate your day/i })
    await expect(heading).toBeVisible()

    const moodSelector = page.getByRole('group', { name: /mood rating selector/i })
    await expect(moodSelector).toBeVisible()
  })

  test('should show offline indicator immediately on page load if offline', async ({
    page,
    context,
  }) => {
    // Go offline
    await context.setOffline(true)

    // Reload page
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Wait a moment for offline detection
    await page.waitForTimeout(1000)

    // Verify offline indicator is visible
    const offlineIndicator = page.getByText(/offline|no connection/i)
    await expect(offlineIndicator).toBeVisible()
  })

  test('should sync pending ratings when back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // Rate while offline
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()
    await page.waitForTimeout(1000)

    // Verify offline save message
    const offlineMessage = page.getByText(/saved offline|will sync/i)
    await expect(offlineMessage).toBeVisible()

    // Go back online
    await context.setOffline(false)

    // Wait for background sync to trigger
    await page.waitForTimeout(3000)

    // Verify sync completed (offline message should disappear)
    await expect(offlineMessage).not.toBeVisible()
  })

  test('should handle notes input while offline', async ({ page, context }) => {
    // Rate online first
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    await averageButton.click()
    await page.waitForTimeout(1000)

    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // Add notes while offline
    const notesInput = page.getByRole('textbox', { name: /day notes/i })
    const testNotes = 'Testing offline notes functionality'
    await notesInput.fill(testNotes)

    // Wait for auto-save attempt
    await page.waitForTimeout(2000)

    // Verify notes remain in input
    await expect(notesInput).toHaveValue(testNotes)
  })

  test('should work on slow network connections', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', (route) => {
      setTimeout(() => route.continue(), 1000) // 1 second delay
    })

    // Try to rate
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    // Should still show optimistic update immediately
    await expect(happyButton).toHaveAttribute('aria-pressed', 'true')

    // Wait for actual save with increased timeout
    await page.waitForTimeout(3000)

    // Verify save completed or offline message appears
    const successOrOffline = page.getByText(/saved|offline/i)
    await expect(successOrOffline).toBeVisible()
  })

  test('should maintain app functionality after multiple offline/online cycles', async ({
    page,
    context,
  }) => {
    // Cycle 1: Go offline and rate
    await context.setOffline(true)
    await page.waitForTimeout(500)

    const sadButton = page.getByRole('button', { name: /rate your day as sad/i })
    await sadButton.click()
    await page.waitForTimeout(1000)

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(2000)

    // Cycle 2: Go offline again
    await context.setOffline(true)
    await page.waitForTimeout(500)

    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()
    await page.waitForTimeout(1000)

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(2000)

    // Verify final state is correct
    await expect(happyButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should cache calendar data for offline viewing', async ({ page, context }) => {
    // Scroll to calendar to ensure it loads
    await page.getByRole('heading', { name: /your mood calendar/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)

    // Go offline
    await context.setOffline(true)

    // Navigate to previous month (should work with cached data)
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()

    // Wait for calendar update
    await page.waitForTimeout(1000)

    // Verify calendar still displays (from cache or optimistic update)
    const calendarGrid = page.getByRole('grid')
    await expect(calendarGrid).toBeVisible()
  })

  test('should show appropriate error message when offline action fails', async ({
    page,
    context,
  }) => {
    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(500)

    // Try to perform an action that requires network
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()
    await page.waitForTimeout(1000)

    // Should show offline save message (not an error, but queued for sync)
    const offlineMessage = page.getByText(/saved offline|will sync/i)
    await expect(offlineMessage).toBeVisible()
  })

  test('should update UI immediately with optimistic updates', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(500)

    // Click mood button
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })

    // Record time before click
    const startTime = Date.now()

    await averageButton.click()

    // Record time when button shows pressed state
    await page.waitForFunction((btn) => {
      const button = document.querySelector(`[aria-label*="${btn}"]`)
      return button?.getAttribute('aria-pressed') === 'true'
    }, 'rate your day as average')

    const endTime = Date.now()

    // Verify update was immediate (< 500ms)
    const updateTime = endTime - startTime
    expect(updateTime).toBeLessThan(500)
  })
})
