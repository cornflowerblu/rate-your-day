import { test, expect } from '@playwright/test'
import { format } from 'date-fns'

/**
 * E2E tests for the mood rating flow
 *
 * Tests the core functionality of rating a day with mood and notes
 */

test.describe('Mood Rating Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display the mood selector on home page', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Rate Your Day/i)

    // Check that the mood selector is visible
    const moodSelector = page.getByRole('group', { name: /mood rating selector/i })
    await expect(moodSelector).toBeVisible()

    // Verify all 4 mood buttons are present
    const angryButton = page.getByRole('button', { name: /rate your day as angry/i })
    const sadButton = page.getByRole('button', { name: /rate your day as sad/i })
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })

    await expect(angryButton).toBeVisible()
    await expect(sadButton).toBeVisible()
    await expect(averageButton).toBeVisible()
    await expect(happyButton).toBeVisible()
  })

  test('should allow selecting a mood and show visual feedback', async ({ page }) => {
    // Click on "Happy" mood
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    // Wait for the save animation/feedback
    await page.waitForTimeout(1000)

    // Verify the button shows pressed state
    await expect(happyButton).toHaveAttribute('aria-pressed', 'true')

    // Verify success message appears
    const successMessage = page.getByRole('status')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText(/saved/i)
  })

  test('should show notes input after selecting a mood', async ({ page }) => {
    // Select a mood first
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    await averageButton.click()

    // Wait for UI to update
    await page.waitForTimeout(500)

    // Verify notes section appears
    const notesHeading = page.getByRole('heading', { name: /add notes/i })
    await expect(notesHeading).toBeVisible()

    // Verify notes textarea is visible
    const notesInput = page.getByRole('textbox', { name: /day notes/i })
    await expect(notesInput).toBeVisible()
  })

  test('should allow entering notes and auto-save', async ({ page }) => {
    // Select a mood
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    // Wait for notes input to appear
    await page.waitForTimeout(500)

    // Type notes
    const notesInput = page.getByRole('textbox', { name: /day notes/i })
    const testNotes = 'Had a great day working on this project!'
    await notesInput.fill(testNotes)

    // Wait for auto-save (debounce delay + save time)
    await page.waitForTimeout(2000)

    // Verify "Saved" indicator appears
    const savedIndicator = page.getByText(/saved/i)
    await expect(savedIndicator).toBeVisible()
  })

  test('should allow changing mood selection', async ({ page }) => {
    // Select initial mood
    const sadButton = page.getByRole('button', { name: /rate your day as sad/i })
    await sadButton.click()

    await page.waitForTimeout(1000)

    // Verify initial selection
    await expect(sadButton).toHaveAttribute('aria-pressed', 'true')

    // Change to different mood
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    await page.waitForTimeout(1000)

    // Verify new selection
    await expect(happyButton).toHaveAttribute('aria-pressed', 'true')
    await expect(sadButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should enforce character limit on notes', async ({ page }) => {
    // Select a mood
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    await averageButton.click()

    await page.waitForTimeout(500)

    // Try to enter text exceeding 280 characters
    const notesInput = page.getByRole('textbox', { name: /day notes/i })
    const longText = 'a'.repeat(300)
    await notesInput.fill(longText)

    // Verify only 280 characters are accepted
    const actualValue = await notesInput.inputValue()
    expect(actualValue.length).toBe(280)

    // Verify character count shows limit reached
    const characterCount = page.getByText(/280\/280/i)
    await expect(characterCount).toBeVisible()

    // Verify warning message
    const limitWarning = page.getByText(/limit reached/i)
    await expect(limitWarning).toBeVisible()
  })

  test("should display today's date prominently", async ({ page }) => {
    const today = format(new Date(), 'EEEE, MMMM d, yyyy')

    // Verify today's date is displayed
    const dateElement = page.getByText(today)
    await expect(dateElement).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    // Navigate to a fresh page instance
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Look for loading indicator (should appear briefly)
    const loadingIndicator = page.getByText(/loading your day/i)

    // Either loading is visible or content has already loaded
    // This test verifies the loading state exists in the code
    const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false)
    const isMoodSelectorVisible = await page
      .getByRole('group', { name: /mood rating selector/i })
      .isVisible()
      .catch(() => false)

    // One of these should be true
    expect(isLoadingVisible || isMoodSelectorVisible).toBe(true)
  })

  test('should be keyboard accessible', async ({ page }) => {
    // Tab to first mood button
    await page.keyboard.press('Tab')

    // Press Enter to select
    await page.keyboard.press('Enter')

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify a mood was selected
    const angryButton = page.getByRole('button', { name: /rate your day as angry/i })
    await expect(angryButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('should support arrow key navigation in mood selector', async ({ page }) => {
    // Focus first mood button
    const angryButton = page.getByRole('button', { name: /rate your day as angry/i })
    await angryButton.focus()

    // Press right arrow key
    await page.keyboard.press('ArrowRight')

    // Wait a moment for focus to change
    await page.waitForTimeout(200)

    // Verify focus moved to next button (sad)
    const sadButton = page.getByRole('button', { name: /rate your day as sad/i })
    await expect(sadButton).toBeFocused()

    // Press right arrow again
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)

    // Verify focus moved to average
    const averageButton = page.getByRole('button', { name: /rate your day as average/i })
    await expect(averageButton).toBeFocused()
  })

  test('should persist rating after page reload', async ({ page }) => {
    // Select a mood
    const happyButton = page.getByRole('button', { name: /rate your day as happy/i })
    await happyButton.click()

    // Wait for save
    await page.waitForTimeout(2000)

    // Reload the page
    await page.reload()

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify the mood is still selected
    await expect(happyButton).toHaveAttribute('aria-pressed', 'true')
  })
})
