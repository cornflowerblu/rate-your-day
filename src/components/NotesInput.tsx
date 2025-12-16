'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface NotesInputProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => Promise<void>
  maxLength?: number
  placeholder?: string
  disabled?: boolean
  autoSaveDelay?: number
}

export default function NotesInput({
  value,
  onChange,
  onSave,
  maxLength = 280,
  placeholder = 'Add notes about your day (optional)...',
  disabled = false,
  autoSaveDelay = 1000,
}: NotesInputProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback(async (notes: string) => {
    if (onSave) {
      setIsSaving(true)
      try {
        await onSave(notes)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Failed to auto-save notes:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }, autoSaveDelay)

  // Handle input change with character limit
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value

    // Enforce character limit
    if (newValue.length <= maxLength) {
      onChange(newValue)
      // Trigger auto-save if onSave is provided
      if (onSave) {
        debouncedSave(newValue)
      }
    }
  }

  // Handle paste events - truncate if exceeds maxLength
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const currentValue = value || ''
    const textarea = textareaRef.current

    if (!textarea) return

    // Get cursor position
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd

    // Calculate new value after paste
    const beforeCursor = currentValue.slice(0, selectionStart)
    const afterCursor = currentValue.slice(selectionEnd)
    const newValue = beforeCursor + pastedText + afterCursor

    // Truncate if needed
    const truncatedValue = newValue.slice(0, maxLength)

    onChange(truncatedValue)
    if (onSave) {
      debouncedSave(truncatedValue)
    }

    // Set cursor position after paste
    const newCursorPos = Math.min(
      selectionStart + pastedText.length,
      maxLength - afterCursor.length
    )
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const characterCount = value?.length || 0
  const isNearLimit = characterCount > maxLength * 0.9
  const isAtLimit = characterCount >= maxLength

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className={`
            w-full px-4 py-3 rounded-lg border resize-none transition-colors
            ${
              isAtLimit
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Day notes"
          aria-describedby="character-count"
        />

        {/* Auto-save indicator */}
        {onSave && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 dark:border-gray-600 border-t-indigo-600"></div>
                <span>Saving...</span>
              </div>
            )}
            {!isSaving && lastSaved && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Saved</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      <div id="character-count" className="mt-2 flex items-center justify-between text-sm">
        <span
          className={`
            transition-colors
            ${isAtLimit ? 'text-red-600 dark:text-red-400 font-medium' : ''}
            ${isNearLimit && !isAtLimit ? 'text-yellow-600 dark:text-yellow-400' : ''}
            ${!isNearLimit ? 'text-gray-500 dark:text-gray-400' : ''}
          `}
        >
          {characterCount}/{maxLength} characters
        </span>

        {isAtLimit && (
          <span className="text-red-600 dark:text-red-400 text-xs font-medium">
            Character limit reached
          </span>
        )}
      </div>
    </div>
  )
}
