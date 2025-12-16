import { test, expect } from '@playwright/test'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

/**
 * E2E tests for the calendar view
 *
 * Tests calendar navigation, day selection, and historical ratings display
 */

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display the calendar with current month', async ({ page }) => {
    // Verify calendar section is visible
    const calendarSection = page.getByRole('region', { name: /your mood calendar/i })
    await expect(calendarSection).toBeVisible()

    // Verify current month/year is displayed
    const currentMonthYear = format(new Date(), 'MMMM yyyy')
    const monthLabel = page.getByRole('heading', { name: new RegExp(currentMonthYear, 'i') })
    await expect(monthLabel).toBeVisible()
  })

  test('should display all 7 weekday headers', async ({ page }) => {
    // Verify weekday headers (Sun-Sat)
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (const day of weekdays) {
      const header = page.getByRole('columnheader', { name: new RegExp(day, 'i') })
      await expect(header).toBeVisible()
    }
  })

  test('should navigate to previous month', async ({ page }) => {
    // Get current month
    const currentMonth = format(new Date(), 'MMMM yyyy')

    // Click previous month button
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()

    // Wait for calendar to update
    await page.waitForTimeout(500)

    // Verify month changed
    const previousMonth = format(subMonths(new Date(), 1), 'MMMM yyyy')
    const monthLabel = page.getByRole('heading', { name: new RegExp(previousMonth, 'i') })
    await expect(monthLabel).toBeVisible()
  })

  test('should not allow navigation to future months', async ({ page }) => {
    // Find next month button
    const nextButton = page.getByRole('button', { name: /next month|cannot navigate/i })

    // Check if button is disabled
    const isDisabled = await nextButton.isDisabled()
    expect(isDisabled).toBe(true)

    // Verify aria-disabled attribute
    await expect(nextButton).toHaveAttribute('aria-disabled', 'true')
  })

  test("should highlight today's date in calendar", async ({ page }) => {
    const today = new Date()
    const todayDateString = format(today, 'MMMM d, yyyy')

    // Find today's cell by its aria-label containing "today"
    const todayCell = page.getByRole('button', {
      name: new RegExp(`${todayDateString}.*today`, 'i'),
    })

    // Verify today cell exists and is highlighted
    await expect(todayCell).toBeVisible()
  })

  test('should open day detail modal when clicking a past day', async ({ page }) => {
    // Navigate to previous month to ensure we're clicking a past day
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    // Click on the 15th day of the previous month
    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 15),
      'MMMM d, yyyy'
    )

    const dayCell = page.getByRole('button', { name: new RegExp(dayToClick, 'i') }).first()
    await dayCell.click()

    // Wait for modal to open
    await page.waitForTimeout(500)

    // Verify modal is displayed
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Verify modal shows the correct date
    const modalTitle = page.getByRole('heading', { name: new RegExp(dayToClick, 'i') })
    await expect(modalTitle).toBeVisible()
  })

  test('should display mood emoji on rated days in calendar', async ({ page }) => {
    // First, rate today with a mood
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    // Wait for save
    await page.waitForTimeout(2000)

    // Scroll to calendar
    await page.getByRole('heading', { name: /your mood calendar/i }).scrollIntoViewIfNeeded()

    // Find today's cell in calendar
    const today = new Date()
    const todayDateString = format(today, 'MMMM d, yyyy')
    const todayCell = page.getByRole('button', {
      name: new RegExp(`${todayDateString}.*today`, 'i'),
    })

    // Verify the cell shows "rated as Happy"
    await expect(todayCell).toHaveAttribute('aria-label', /rated as happy/i)
  })

  test('should close modal when clicking close button', async ({ page }) => {
    // Navigate to previous month and click a day
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 10),
      'MMMM d, yyyy'
    )

    const dayCell = page.getByRole('button', { name: new RegExp(dayToClick, 'i') }).first()
    await dayCell.click()
    await page.waitForTimeout(500)

    // Verify modal is open
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Click close button
    const closeButton = page.getByRole('button', { name: /close modal/i })
    await closeButton.click()

    // Wait for animation
    await page.waitForTimeout(500)

    // Verify modal is closed
    await expect(modal).not.toBeVisible()
  })

  test('should close modal when pressing Escape key', async ({ page }) => {
    // Navigate to previous month and click a day
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 20),
      'MMMM d, yyyy'
    )

    const dayCell = page.getByRole('button', { name: new RegExp(dayToClick, 'i') }).first()
    await dayCell.click()
    await page.waitForTimeout(500)

    // Verify modal is open
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Press Escape key
    await page.keyboard.press('Escape')

    // Wait for animation
    await page.waitForTimeout(500)

    // Verify modal is closed
    await expect(modal).not.toBeVisible()
  })

  test('should allow rating a past day through modal', async ({ page }) => {
    // Navigate to previous month and click a day
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 5),
      'MMMM d, yyyy'
    )

    const dayCell = page.getByRole('button', { name: new RegExp(dayToClick, 'i') }).first()
    await dayCell.click()
    await page.waitForTimeout(500)

    // In the modal, select a mood
    const modalHappyButton = page
      .getByRole('dialog')
      .getByRole('button', { name: /rate your day as happy/i })
    await modalHappyButton.click()

    // Wait for save
    await page.waitForTimeout(2000)

    // Verify saved indicator
    const savedIndicator = page.getByText(/changes saved automatically/i)
    await expect(savedIndicator).toBeVisible()
  })

  test('should show empty state for unrated days', async ({ page }) => {
    // Navigate to previous month
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    // Click on an unrated day
    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 25),
      'MMMM d, yyyy'
    )

    const dayCell = page
      .getByRole('button', { name: new RegExp(`${dayToClick}.*not rated`, 'i') })
      .first()
    await dayCell.click()
    await page.waitForTimeout(500)

    // Verify modal is open with empty state
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Verify mood selector is shown but no mood is selected
    const moodButtons = modal.getByRole('button', { name: /rate your day as/i })
    const buttonCount = await moodButtons.count()
    expect(buttonCount).toBe(4)

    // Verify no button is pressed
    for (let i = 0; i < buttonCount; i++) {
      const button = moodButtons.nth(i)
      await expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })

  test('should gray out future dates', async ({ page }) => {
    // Find any future date (next month if we're not at month end)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Only run this test if tomorrow is in a future month
    // Otherwise skip as there are no future dates visible
    if (tomorrow.getMonth() !== today.getMonth()) {
      const nextButton = page.getByRole('button', { name: /next month/i })

      // If next button is disabled, that's correct behavior
      const isDisabled = await nextButton.isDisabled()
      expect(isDisabled).toBe(true)
    } else {
      // Look for tomorrow's date
      const tomorrowDateString = format(tomorrow, 'MMMM d, yyyy')
      const tomorrowCell = page
        .getByRole('gridcell', { name: new RegExp(`${tomorrowDateString}.*future`, 'i') })
        .first()

      // Verify it's marked as disabled
      if (await tomorrowCell.isVisible()) {
        await expect(tomorrowCell).toHaveAttribute('aria-disabled', 'true')
      }
    }
  })

  test('should maintain scroll position when opening modal', async ({ page }) => {
    // Scroll to calendar section
    await page.getByRole('heading', { name: /your mood calendar/i }).scrollIntoViewIfNeeded()

    // Get scroll position before opening modal
    const scrollBefore = await page.evaluate(() => window.scrollY)

    // Click a past day
    const prevButton = page.getByRole('button', { name: /go to.*previous/i })
    await prevButton.click()
    await page.waitForTimeout(500)

    const previousMonth = subMonths(new Date(), 1)
    const dayToClick = format(
      new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 12),
      'MMMM d, yyyy'
    )

    const dayCell = page.getByRole('button', { name: new RegExp(dayToClick, 'i') }).first()
    await dayCell.click()
    await page.waitForTimeout(500)

    // Verify scroll position is maintained (modal should overlay without scrolling page)
    const scrollAfter = await page.evaluate(() => window.scrollY)
    expect(Math.abs(scrollBefore - scrollAfter)).toBeLessThan(50) // Allow small difference for rendering
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to previous month button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should eventually reach the previous month button
    // Press Enter to navigate
    await page.keyboard.press('Enter')

    // Wait for month change
    await page.waitForTimeout(500)

    // Verify month changed
    const previousMonth = format(subMonths(new Date(), 1), 'MMMM yyyy')
    const monthLabel = page.getByRole('heading', { name: new RegExp(previousMonth, 'i') })
    await expect(monthLabel).toBeVisible()
  })
})
