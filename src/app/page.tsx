'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import MoodSelector from '@/components/MoodSelector'
import OfflineIndicator from '@/components/OfflineIndicator'
import NotificationButton from '@/components/NotificationButton'
import { MoodLevel, RatingResponse } from '@/lib/types'
import { savePendingRating, getCachedRating, cacheRating, isOnline } from '@/lib/offline-db'

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        } else {
          setSelectedMood(null)
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

  if (isLoading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your day...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      {/* Offline Indicator */}
      <OfflineIndicator />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Rate Your Day
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{todayFormatted}</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-center">{successMessage}</p>
          </div>
        )}

        {/* Mood Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
            {selectedMood ? 'How was your day?' : "How's your day going?"}
          </h2>

          <MoodSelector
            selectedMood={selectedMood}
            onMoodSelect={handleMoodSelect}
            disabled={isSaving}
          />

          {isSaving && (
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}

          {selectedMood && !isSaving && (
            <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
              Tap another emoji to change your rating
            </p>
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
            Daily Reminders
          </h2>
          <NotificationButton />
        </div>

        {/* Placeholder for future calendar */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Calendar view coming soon...</p>
        </div>
      </div>
    </main>
  )
}
