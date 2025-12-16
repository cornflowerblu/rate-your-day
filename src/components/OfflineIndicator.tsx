'use client'

import { useEffect, useState } from 'react'

interface OfflineIndicatorProps {
  className?: string
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [showSyncSuccess, setShowSyncSuccess] = useState(false)

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Listen for sync completion messages from Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        const { syncedCount } = event.data
        if (syncedCount > 0) {
          setShowSyncSuccess(true)
          setPendingCount(0)
          // Hide success message after 3 seconds
          setTimeout(() => setShowSyncSuccess(false), 3000)
        }
      } else if (event.data?.type === 'PENDING_COUNT_UPDATE') {
        setPendingCount(event.data.count)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])

  // Don't show anything if online and no pending changes
  if (isOnline && !showSyncSuccess && pendingCount === 0) {
    return null
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="badge-warning px-4 py-2.5 shadow-elevated backdrop-blur-sm bg-yellow-50/95 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl flex items-center gap-2.5 animate-slide-in-down">
          <div className="relative">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
            You&apos;re offline
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </span>
        </div>
      )}

      {/* Sync Success Indicator */}
      {showSyncSuccess && isOnline && (
        <div className="badge-success px-4 py-2.5 shadow-elevated backdrop-blur-sm bg-green-50/95 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl flex items-center gap-2.5 animate-slide-in-down">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
            Changes synced successfully!
          </span>
        </div>
      )}
    </div>
  )
}
