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
  autoSaveDelay = 300,
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
            w-full px-4 py-3 rounded-xl border resize-none transition-all duration-200
            ${
              isAtLimit
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 shadow-sm shadow-red-100 dark:shadow-red-900/20'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 shadow-sm hover:border-gray-400 dark:hover:border-gray-500'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Day notes"
          aria-describedby="character-count"
        />

        {/* Auto-save indicator */}
        {onSave && (
          <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm animate-fade-in">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
                <span>Saving...</span>
              </div>
            )}
            {!isSaving && lastSaved && (
              <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50/90 dark:bg-green-900/20 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm animate-fade-in">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Saved</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      <div id="character-count" className="mt-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`
              font-medium transition-colors
              ${isAtLimit ? 'text-red-600 dark:text-red-400' : ''}
              ${isNearLimit && !isAtLimit ? 'text-yellow-600 dark:text-yellow-400' : ''}
              ${!isNearLimit ? 'text-gray-500 dark:text-gray-400' : ''}
            `}
          >
            {characterCount}/{maxLength}
          </span>
          {isAtLimit && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold animate-fade-in">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Limit reached
            </span>
          )}
          {isNearLimit && !isAtLimit && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold animate-fade-in">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Near limit
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
