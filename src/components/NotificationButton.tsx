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
      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          🔔 Notifications are blocked. Please enable them in your browser settings to get daily
          reminders.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      {isSubscribed ? (
        <button
          onClick={unsubscribeFromPush}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : '🔕 Disable Daily Reminders'}
        </button>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isLoading ? 'Enabling...' : '🔔 Enable Daily Reminders'}
        </button>
      )}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Get a notification at 9 PM CST if you haven't rated your day
      </p>
    </div>
  )
}
