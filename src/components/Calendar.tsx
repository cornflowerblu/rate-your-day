'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addMonths,
  subMonths,
  isAfter,
} from 'date-fns'
import DayCell from './DayCell'
import { MoodLevel } from '@/lib/types'

interface CalendarProps {
  initialMonth?: Date
  onDayClick?: (date: Date) => void
}

interface RatingData {
  date: string // YYYY-MM-DD format
  rating: MoodLevel
}

/**
 * Calendar component - Monthly grid view showing mood patterns
 *
 * Features:
 * - Sunday-Saturday grid layout (7 columns)
 * - Shows all days in the month plus adjacent days to fill the grid
 * - Displays mood emojis on rated days
 * - Highlights today's date
 * - Grays out future dates
 * - Month/year label display
 * - Loading skeleton while fetching
 * - Error handling for failed API calls
 */
export default function Calendar({ initialMonth = new Date(), onDayClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [ratings, setRatings] = useState<Record<string, MoodLevel>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate calendar grid dates
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    // Get the full week range (Sunday to Saturday)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 0 = Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    // Generate all days in the range
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Fetch ratings for the current month
  useEffect(() => {
    const fetchRatings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const monthString = format(currentMonth, 'yyyy-MM')
        const response = await fetch(`/api/ratings?month=${monthString}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ratings: ${response.statusText}`)
        }

        const data = await response.json()

        // Convert array to map for O(1) lookup
        const ratingsMap: Record<string, MoodLevel> = {}
        if (data.ratings && Array.isArray(data.ratings)) {
          data.ratings.forEach((rating: RatingData) => {
            ratingsMap[rating.date] = rating.rating
          })
        }

        setRatings(ratingsMap)
      } catch (err) {
        console.error('Error fetching ratings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load ratings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRatings()
  }, [currentMonth])

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1)
    const today = new Date()

    // Prevent navigation to future months
    if (isAfter(startOfMonth(nextMonth), startOfMonth(today))) {
      return
    }

    setCurrentMonth(nextMonth)
  }

  // Check if we're viewing the current month (disable next button)
  const isCurrentMonth = useMemo(() => {
    const today = new Date()
    return isSameMonth(currentMonth, today)
  }, [currentMonth])

  // Days of week header (Sunday - Saturday)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Month and Year Header with Navigation */}
      <div
        className="mb-6 flex items-center justify-between"
        role="group"
        aria-label="Calendar navigation"
      >
        {/* Previous Month Button */}
        <button
          onClick={goToPreviousMonth}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`Go to ${format(subMonths(currentMonth, 1), 'MMMM yyyy')}`}
          title="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Month and Year Label */}
        <h2
          id="calendar-month-label"
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
          aria-live="polite"
          aria-atomic="true"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        {/* Next Month Button */}
        <button
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
          aria-label={
            isCurrentMonth
              ? 'Cannot navigate to future months'
              : `Go to ${format(addMonths(currentMonth, 1), 'MMMM yyyy')}`
          }
          aria-disabled={isCurrentMonth}
          title={isCurrentMonth ? 'Current month' : 'Next month'}
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-in-down">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="card-elevated p-5 sm:p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3" role="row">
          {weekDays.map((day, index) => (
            <div
              key={day}
              role="columnheader"
              aria-label={
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                  index
                ]
              }
              className="text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 py-2"
            >
              <span aria-hidden="true">{day}</span>
            </div>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
            aria-label="Loading calendar"
            aria-busy="true"
          >
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 shimmer"
                role="presentation"
              />
            ))}
          </div>
        ) : (
          /* Calendar days grid */
          <div
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
            role="grid"
            aria-labelledby="calendar-month-label"
            aria-readonly="false"
          >
            {calendarDays.map((date) => {
              const dateString = format(date, 'yyyy-MM-dd')
              const rating = ratings[dateString]
              const isCurrentMonth = isSameMonth(date, currentMonth)

              return (
                <DayCell
                  key={dateString}
                  date={date}
                  rating={rating}
                  isCurrentMonth={isCurrentMonth}
                  onDayClick={onDayClick}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>Tap any day to view or edit your rating</p>
      </div>
    </div>
  )
}
