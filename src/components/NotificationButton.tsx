'use client'

import { useState, useEffect } from 'react'

export default function NotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check if already subscribed
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const subscribeToPush = async () => {
    try {
      setIsLoading(true)

      // Request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        alert('Notification permission denied. Please enable it in your browser settings.')
        return
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setIsSubscribed(true)
      alert(
        "✅ Push notifications enabled! You'll get a reminder at 9 PM if you haven't rated your day."
      )
    } catch (error) {
      console.error('Error subscribing to push:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
        })
      }

      setIsSubscribed(false)
      alert('Push notifications disabled.')
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Failed to disable notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if notifications not supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  if (permission === 'denied') {
    return (
      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow-sm animate-fade-in">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium text-left">
            Notifications are blocked. Please enable them in your browser settings to get daily
            reminders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-3">
      {isSubscribed ? (
        <button
          onClick={unsubscribeFromPush}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 dark:border-gray-300 border-t-transparent"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>Disable Daily Reminders</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>Enabling...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>Enable Daily Reminders</span>
            </>
          )}
        </button>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Get reminded at 9 PM CST if you haven't rated your day</span>
      </p>
    </div>
  )
}
