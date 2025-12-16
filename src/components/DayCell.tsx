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
        group relative
        aspect-square
        flex flex-col items-center justify-center
        p-2
        rounded-xl
        transition-all duration-200 ease-out
        ${isCurrentDay ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 bg-primary-50 dark:bg-primary-950/20' : 'bg-gray-50 dark:bg-gray-800/50'}
        ${!isCurrentMonth ? 'opacity-30' : ''}
        ${isFutureDate ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${isClickable && !isFutureDate ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-soft hover:scale-105 active:scale-95' : ''}
        ${isClickable && !isFutureDate ? 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500' : ''}
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
          text-xs sm:text-sm font-semibold mb-1
          transition-colors duration-200
          ${isCurrentDay ? 'text-primary-700 dark:text-primary-400 font-bold text-base' : 'text-gray-700 dark:text-gray-300'}
          ${isFutureDate ? 'text-gray-400 dark:text-gray-600' : ''}
          ${isClickable && !isFutureDate ? 'group-hover:text-gray-900 dark:group-hover:text-gray-100' : ''}
        `}
      >
        {dayNumber}
      </span>

      {/* Mood emoji display */}
      {mood && !isFutureDate && (
        <div className="flex flex-col items-center gap-1 transition-transform duration-200 group-hover:scale-110">
          <span
            className="text-xl sm:text-3xl filter drop-shadow-sm"
            role="img"
            aria-label={mood.label}
          >
            {mood.emoji}
          </span>
        </div>
      )}

      {/* Empty state for unrated days (subtle indicator) */}
      {!mood && !isFutureDate && isCurrentMonth && (
        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-200 group-hover:bg-gray-400 dark:group-hover:bg-gray-500 group-hover:scale-125" />
      )}

      {/* Today indicator (pulse animation) */}
      {isCurrentDay && (
        <div className="absolute top-1.5 right-1.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary-500 animate-ping opacity-75" />
          </div>
        </div>
      )}
    </div>
  )
}
