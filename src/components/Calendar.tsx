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

  // Days of week header (Sunday - Saturday)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Month and Year Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Calendar days grid */
          <div className="grid grid-cols-7 gap-2" role="grid">
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

      {/* Legend (optional - helps users understand the colors) */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        <p>Tap a day to view or edit your rating</p>
      </div>
    </div>
  )
}
