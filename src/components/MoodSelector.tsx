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
    <div className="flex gap-4 justify-center items-center">
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
              relative
              flex flex-col items-center gap-2
              p-4 rounded-2xl
              transition-all duration-200
              ${
                isSelected
                  ? 'scale-110 shadow-lg bg-gray-100 dark:bg-gray-800'
                  : 'hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            `}
            aria-label={`Rate your day as ${mood.label}`}
            aria-pressed={isSelected}
          >
            <span
              className={`
                text-6xl
                transition-all duration-200
                ${isSelected ? 'animate-bounce-once' : ''}
              `}
              role="img"
              aria-label={mood.label}
            >
              {mood.emoji}
            </span>
            <span
              className={`
                text-sm font-medium
                transition-colors duration-200
                ${isSelected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}
              `}
            >
              {mood.label}
            </span>
            {isSelected && (
              <div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
