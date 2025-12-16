'use client'

import { MoodLevel, MOOD_EMOJIS } from '@/lib/types'
import { isToday, isFuture, format } from 'date-fns'

interface DayCellProps {
  date: Date
  rating?: MoodLevel | null
  isCurrentMonth: boolean
  onDayClick?: (date: Date) => void
}

/**
 * DayCell component - Individual day cell in the calendar grid
 *
 * Features:
 * - Shows mood emoji for rated days
 * - Empty state for unrated days
 * - Highlights today with a border
 * - Grays out future dates (not selectable)
 * - Dims dates from adjacent months
 * - Click handler for day interaction
 */
export default function DayCell({ date, rating, isCurrentMonth, onDayClick }: DayCellProps) {
  const dayNumber = format(date, 'd')
  const isCurrentDay = isToday(date)
  const isFutureDate = isFuture(date) && !isCurrentDay
  const isClickable = !isFutureDate && onDayClick
  const mood = rating ? MOOD_EMOJIS[rating] : null

  const handleClick = () => {
    if (isClickable) {
      onDayClick(date)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onDayClick(date)
    }
  }

  return (
    <div
      className={`
        relative
        aspect-square
        flex flex-col items-center justify-center
        p-2
        rounded-lg
        transition-all duration-200
        ${isCurrentDay ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        ${!isCurrentMonth ? 'opacity-30' : ''}
        ${isFutureDate ? 'opacity-40 cursor-not-allowed' : ''}
        ${isClickable && !isFutureDate ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95' : ''}
        ${isClickable && !isFutureDate ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : 'gridcell'}
      tabIndex={isClickable ? 0 : -1}
      aria-label={`${format(date, 'MMMM d, yyyy')}${rating ? `, rated as ${mood?.label}` : ', not rated'}${isCurrentDay ? ', today' : ''}${isFutureDate ? ', future date' : ''}`}
      aria-disabled={isFutureDate}
    >
      {/* Day number */}
      <span
        className={`
          text-sm font-medium mb-1
          ${isCurrentDay ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
          ${isFutureDate ? 'text-gray-400 dark:text-gray-600' : ''}
        `}
      >
        {dayNumber}
      </span>

      {/* Mood emoji display */}
      {mood && !isFutureDate && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl sm:text-3xl" role="img" aria-label={mood.label}>
            {mood.emoji}
          </span>
        </div>
      )}

      {/* Empty state for unrated days (subtle indicator) */}
      {!mood && !isFutureDate && isCurrentMonth && (
        <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Today indicator (subtle dot at the top) */}
      {isCurrentDay && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
      )}
    </div>
  )
}
