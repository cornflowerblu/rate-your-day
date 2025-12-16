'use client'

import { MoodLevel, MOOD_EMOJIS } from '@/lib/types'

interface MoodSelectorProps {
  selectedMood?: MoodLevel | null
  onMoodSelect: (mood: MoodLevel) => void
  disabled?: boolean
}

export default function MoodSelector({
  selectedMood,
  onMoodSelect,
  disabled = false,
}: MoodSelectorProps) {
  return (
    <div className="flex gap-3 sm:gap-4 justify-center items-center flex-wrap">
      {[1, 2, 3, 4].map((level) => {
        const mood = MOOD_EMOJIS[level as MoodLevel]
        const isSelected = selectedMood === level

        return (
          <button
            key={level}
            type="button"
            onClick={() => onMoodSelect(level as MoodLevel)}
            disabled={disabled}
            className={`
              group relative
              flex flex-col items-center gap-2.5
              p-5 sm:p-6 rounded-2xl min-w-[90px] sm:min-w-[100px]
              transition-all duration-200 ease-out
              ${
                isSelected
                  ? 'scale-110 shadow-elevated ring-2 ring-offset-2 bg-white dark:bg-gray-800'
                  : 'hover:scale-105 hover:shadow-soft hover:bg-gray-50 dark:hover:bg-gray-900/50 shadow-subtle bg-white dark:bg-gray-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            `}
            aria-label={`Rate your day as ${mood.label}`}
            aria-pressed={isSelected}
          >
            <span
              className={`
                text-5xl sm:text-6xl
                transition-all duration-200
                ${isSelected ? 'animate-bounce-once' : 'group-hover:scale-110'}
              `}
              role="img"
              aria-label={mood.label}
            >
              {mood.emoji}
            </span>
            <span
              className={`
                text-xs sm:text-sm font-semibold tracking-wide
                transition-colors duration-200
                ${
                  isSelected
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                }
              `}
            >
              {mood.label}
            </span>
            {isSelected && (
              <div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1.5 rounded-full animate-fade-in shadow-md"
                style={{ backgroundColor: mood.color }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
