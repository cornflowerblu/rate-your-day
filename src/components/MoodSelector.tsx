'use client'

import { useRef, useEffect } from 'react'
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
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation (arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent, currentLevel: MoodLevel) => {
    if (disabled) return

    let newLevel: MoodLevel | null = null

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        // Move to previous mood (with wrapping)
        newLevel = currentLevel === 1 ? 4 : ((currentLevel - 1) as MoodLevel)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        // Move to next mood (with wrapping)
        newLevel = currentLevel === 4 ? 1 : ((currentLevel + 1) as MoodLevel)
        break
      case 'Home':
        e.preventDefault()
        newLevel = 1
        break
      case 'End':
        e.preventDefault()
        newLevel = 4
        break
      default:
        return
    }

    // Focus the new button
    if (newLevel !== null) {
      const newIndex = newLevel - 1
      buttonRefs.current[newIndex]?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-3 sm:gap-4 justify-center items-center flex-wrap"
      role="group"
      aria-label="Mood rating selector"
    >
      {[1, 2, 3, 4].map((level, index) => {
        const mood = MOOD_EMOJIS[level as MoodLevel]
        const isSelected = selectedMood === level

        return (
          <button
            key={level}
            ref={(el) => {
              buttonRefs.current[index] = el
            }}
            type="button"
            onClick={() => onMoodSelect(level as MoodLevel)}
            onKeyDown={(e) => handleKeyDown(e, level as MoodLevel)}
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
            aria-label={`Rate your day as ${mood.label}, ${level} out of 4`}
            aria-pressed={isSelected}
            tabIndex={0}
          >
            <span
              className={`
                text-5xl sm:text-6xl
                transition-all duration-200
                ${isSelected ? 'animate-bounce-once' : 'group-hover:scale-110'}
              `}
              role="img"
              aria-label={mood.label}
              aria-hidden="false"
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
                    : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                }
              `}
            >
              {mood.label}
            </span>
            {isSelected && (
              <div
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1.5 rounded-full animate-fade-in shadow-md"
                style={{ backgroundColor: mood.color }}
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
