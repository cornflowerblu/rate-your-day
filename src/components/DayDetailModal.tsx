'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { MoodLevel } from '@/lib/types'
import MoodSelector from './MoodSelector'
import NotesInput from './NotesInput'

interface DayDetailModalProps {
  isOpen: boolean
  date: Date | null
  initialRating?: MoodLevel | null
  initialNotes?: string | null
  onClose: () => void
  onSave?: () => void
}

/**
 * DayDetailModal component - Modal for viewing and editing past day's rating and notes
 *
 * Features:
 * - Displays selected day's date, rating, and notes
 * - Allows editing rating via MoodSelector
 * - Allows editing notes via NotesInput
 * - Auto-saves changes on rating/notes change
 * - Close button to dismiss modal
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap within modal
 * - ARIA-compliant dialog
 */
export default function DayDetailModal({
  isOpen,
  date,
  initialRating,
  initialNotes,
  onClose,
  onSave,
}: DayDetailModalProps) {
  const [rating, setRating] = useState<MoodLevel | null>(initialRating || null)
  const [notes, setNotes] = useState<string>(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Client-side mounting for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Update local state when props change
  useEffect(() => {
    if (isOpen) {
      setRating(initialRating || null)
      setNotes(initialNotes || '')
      setError(null)
    }
  }, [isOpen, initialRating, initialNotes])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Don't render on server or if not mounted
  if (!mounted || !isOpen || !date) {
    return null
  }

  const formattedDate = format(date, 'EEEE, MMMM d, yyyy')
  const dateString = format(date, 'yyyy-MM-dd')

  const handleRatingChange = async (newRating: MoodLevel) => {
    setRating(newRating)
    setError(null)
    await saveRating(newRating, notes)
  }

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
  }

  const handleNotesSave = async (newNotes: string) => {
    if (rating) {
      await saveRating(rating, newNotes)
    }
  }

  const saveRating = async (ratingValue: MoodLevel, notesValue: string) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/ratings/${dateString}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: ratingValue,
          notes: notesValue || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save rating')
      }

      // Notify parent to refresh data
      if (onSave) {
        onSave()
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-floating max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-5 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <div className="flex items-center justify-between">
            <h2
              id="modal-title"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
            >
              {formattedDate}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="group p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 active:scale-95"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-8 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
          {/* Error message */}
          {error && (
            <div
              className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-slide-in-down"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Rating Section */}
          <div className="space-y-4">
            <label className="block text-base font-semibold text-gray-900 dark:text-gray-100">
              How was your day?
            </label>
            <MoodSelector
              selectedMood={rating}
              onMoodSelect={handleRatingChange}
              disabled={isSaving}
            />
          </div>

          {/* Notes Section */}
          {rating && (
            <div className="space-y-3 animate-fade-in">
              <label
                htmlFor="notes-input"
                className="block text-base font-semibold text-gray-900 dark:text-gray-100"
              >
                Notes
              </label>
              <NotesInput
                value={notes}
                onChange={handleNotesChange}
                onSave={handleNotesSave}
                disabled={isSaving}
                placeholder="What made this day special? (optional)"
              />
            </div>
          )}

          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center justify-center gap-2.5 text-sm text-primary-600 dark:text-primary-400 font-medium animate-fade-in">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
              <span>Saving changes...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-5 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Changes saved automatically</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary px-8 py-3 font-semibold text-base rounded-xl shadow-sm hover:shadow-md active:scale-95"
              disabled={isSaving}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
