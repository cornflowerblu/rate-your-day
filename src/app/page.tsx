'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import MoodSelector from '@/components/MoodSelector'
import NotesInput from '@/components/NotesInput'
import Calendar from '@/components/Calendar'
import OfflineIndicator from '@/components/OfflineIndicator'
import NotificationButton from '@/components/NotificationButton'
import DayDetailModal from '@/components/DayDetailModal'
import { SignOutButton } from '@/components/SignOutButton'
import { MoodLevel, RatingResponse } from '@/lib/types'
import { savePendingRating, getCachedRating, cacheRating, isOnline } from '@/lib/offline-db'

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modal state for viewing/editing past days
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalRating, setModalRating] = useState<MoodLevel | null>(null)
  const [modalNotes, setModalNotes] = useState<string | null>(null)
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy')

  // Load today's rating on mount
  useEffect(() => {
    const fetchTodayRating = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Try to fetch from network first
        if (isOnline()) {
          try {
            const response = await fetch(`/api/ratings/${today}`)

            if (response.status === 404) {
              // No rating for today yet - this is fine
              setSelectedMood(null)
              return
            }

            if (!response.ok) {
              throw new Error('Failed to fetch rating')
            }

            const data: RatingResponse = await response.json()
            setSelectedMood(data.rating)
            setNotes(data.notes || '')

            // Cache the rating for offline access
            await cacheRating(today, data.rating, data.notes || undefined)
            return
          } catch (err) {
            console.error('Network error, falling back to cache:', err)
          }
        }

        // If offline or network failed, try cached data
        const cachedRating = await getCachedRating(today)
        if (cachedRating) {
          setSelectedMood(cachedRating.rating)
          setNotes(cachedRating.notes || '')
        } else {
          setSelectedMood(null)
          setNotes('')
        }
      } catch (err) {
        console.error('Error fetching rating:', err)
        setError('Failed to load your rating. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodayRating()
  }, [today])

  // Listen for sync completion messages from Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        const { syncedCount } = event.data
        if (syncedCount > 0) {
          // Refresh the rating after sync
          const refreshRating = async () => {
            try {
              const response = await fetch(`/api/ratings/${today}`)
              if (response.ok) {
                const data: RatingResponse = await response.json()
                setSelectedMood(data.rating)
                setNotes(data.notes || '')
                await cacheRating(today, data.rating, data.notes || undefined)
              }
            } catch (err) {
              console.error('Error refreshing after sync:', err)
            }
          }
          refreshRating()
        }
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [today])

  // Handle mood selection with immediate save
  const handleMoodSelect = async (mood: MoodLevel) => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Optimistically update UI
      setSelectedMood(mood)

      // If online, save to server
      if (isOnline()) {
        try {
          const response = await fetch(`/api/ratings/${today}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating: mood }),
          })

          if (!response.ok) {
            throw new Error('Failed to save rating')
          }

          // Cache the rating for offline access
          await cacheRating(today, mood)

          // Show success message briefly
          setSuccessMessage('Rating saved!')
          setTimeout(() => setSuccessMessage(null), 2000)
        } catch (err) {
          console.error('Network error, saving offline:', err)
          // Save to IndexedDB for later sync
          await savePendingRating(today, mood)
          setSuccessMessage('Saved offline. Will sync when online.')
          setTimeout(() => setSuccessMessage(null), 3000)
        }
      } else {
        // Offline: save to IndexedDB for later sync
        await savePendingRating(today, mood)
        setSuccessMessage('Saved offline. Will sync when online.')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      setError('Failed to save your rating. Please try again.')

      // Revert optimistic update on error
      if (isOnline()) {
        const response = await fetch(`/api/ratings/${today}`)
        if (response.ok) {
          const data: RatingResponse = await response.json()
          setSelectedMood(data.rating)
        } else {
          setSelectedMood(null)
        }
      } else {
        // Try to get cached rating
        const cachedRating = await getCachedRating(today)
        if (cachedRating) {
          setSelectedMood(cachedRating.rating)
        } else {
          setSelectedMood(null)
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Handle notes save with auto-save
  const handleNotesSave = async (newNotes: string) => {
    try {
      // If no rating selected yet, just update local state
      if (!selectedMood) {
        setNotes(newNotes)
        return
      }

      // If online, save to server
      if (isOnline()) {
        const response = await fetch(`/api/ratings/${today}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rating: selectedMood, notes: newNotes }),
        })

        if (!response.ok) {
          throw new Error('Failed to save notes')
        }

        // Cache the updated rating with notes
        await cacheRating(today, selectedMood, newNotes || undefined)
      } else {
        // Offline: save to IndexedDB for later sync
        await savePendingRating(today, selectedMood, newNotes || undefined)
      }
    } catch (err) {
      console.error('Error saving notes:', err)
      // Still update local state even if save fails
      setNotes(newNotes)
    }
  }

  // Handle day click in calendar - open modal for past days
  const handleDayClick = async (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')

    // If clicked day is today, scroll to today's rating section instead of opening modal
    if (dateString === today) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      // Fetch rating for the selected date
      const response = await fetch(`/api/ratings/${dateString}`)

      // Handle 404 (no rating for this day) - this is not an error, open modal with empty state
      if (response.status === 404) {
        setModalDate(date)
        setModalRating(null)
        setModalNotes(null)
        setModalOpen(true)
        return
      }

      // Handle other HTTP errors
      if (!response.ok) {
        console.error('Failed to fetch rating:', response.status, response.statusText)
        setError('Failed to load rating for selected day')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Success - parse and display the rating
      const data: RatingResponse = await response.json()
      setModalDate(date)
      setModalRating(data.rating)
      setModalNotes(data.notes || null)
      setModalOpen(true)
    } catch (err) {
      // Network errors or JSON parse errors
      console.error('Error fetching rating for date:', err)
      // Still open the modal with empty state - user can create a rating
      setModalDate(date)
      setModalRating(null)
      setModalNotes(null)
      setModalOpen(true)
    }
  }

  // Handle modal close - refresh calendar to show updated data
  const handleModalClose = () => {
    setModalOpen(false)
    setModalDate(null)
    setModalRating(null)
    setModalNotes(null)
  }

  // Handle save from modal - refresh calendar
  const handleModalSave = () => {
    // Increment calendar refresh key to force re-fetch
    setCalendarRefreshKey((prev) => prev + 1)

    // If the modal was editing today's date, refresh today's data too
    if (modalDate && format(modalDate, 'yyyy-MM-dd') === today) {
      const fetchTodayRating = async () => {
        try {
          const response = await fetch(`/api/ratings/${today}`)
          if (response.ok) {
            const data: RatingResponse = await response.json()
            setSelectedMood(data.rating)
            setNotes(data.notes || '')
            await cacheRating(today, data.rating, data.notes || undefined)
          }
        } catch (err) {
          console.error('Error refreshing today rating:', err)
        }
      }
      fetchTodayRating()
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium animate-pulse-soft">
            Loading your day...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Offline Indicator */}
      <OfflineIndicator />

      <div className="max-w-5xl mx-auto">
        {/* Header with Sign Out Button */}
        <div className="relative mb-8 sm:mb-12">
          <div className="absolute top-0 right-0">
            <SignOutButton />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black mb-3 bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight animate-fade-in">
              Rate Your Day
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{todayFormatted}</span>
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-sm animate-slide-in-down">
            <p className="text-red-800 dark:text-red-200 text-center font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-sm animate-slide-in-down">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Mood Selection */}
        <div className="card-elevated mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100 tracking-tight">
            {selectedMood ? 'How was your day?' : "How's your day going?"}
          </h2>

          <MoodSelector
            selectedMood={selectedMood}
            onMoodSelect={handleMoodSelect}
            disabled={isSaving}
          />

          {isSaving && (
            <div className="mt-6 flex items-center justify-center gap-2.5 text-primary-600 dark:text-primary-400 animate-fade-in">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
              <span className="text-sm font-medium">Saving...</span>
            </div>
          )}

          {selectedMood && !isSaving && (
            <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Tap another emoji to change your rating</span>
            </p>
          )}

          {/* Notes Input - Show when mood is selected */}
          {selectedMood && (
            <div className="mt-10 pt-10 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
              <h3 className="text-xl font-bold mb-5 text-gray-900 dark:text-gray-100">
                Add Notes{' '}
                <span className="text-gray-500 dark:text-gray-500 font-normal text-base">
                  (Optional)
                </span>
              </h3>
              <NotesInput
                value={notes}
                onChange={setNotes}
                onSave={handleNotesSave}
                disabled={isSaving}
                maxLength={280}
                autoSaveDelay={1000}
              />
            </div>
          )}
        </div>

        {/* Monthly Calendar View */}
        <div className="mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>Your Mood Calendar</span>
          </h2>
          <Calendar key={calendarRefreshKey} onDayClick={handleDayClick} />
        </div>

        {/* Notification Settings */}
        <div className="card-elevated mb-12 animate-fade-in">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100 tracking-tight flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span>Daily Reminders</span>
          </h2>
          <NotificationButton />
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-500">
          <p>Made with ❤️ for tracking your daily moods</p>
        </div>
      </div>

      {/* Day Detail Modal for viewing/editing past days */}
      <DayDetailModal
        isOpen={modalOpen}
        date={modalDate}
        initialRating={modalRating}
        initialNotes={modalNotes}
        onClose={handleModalClose}
        onSave={handleModalSave}
      />
    </main>
  )
}
