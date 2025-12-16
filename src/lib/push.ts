/**
 * Push Notification Helpers
 *
 * Provides utilities for managing Web Push API subscriptions and sending notifications
 * Uses VAPID (Voluntary Application Server Identification) for authentication
 */

/**
 * Converts a base64 URL-encoded string to a Uint8Array
 * Required for VAPID public key conversion for PushManager.subscribe()
 *
 * @param base64String - Base64 URL-encoded VAPID public key
 * @returns Uint8Array suitable for applicationServerKey parameter
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as Uint8Array<ArrayBuffer>
}

/**
 * Checks if the browser supports push notifications
 *
 * @returns true if browser supports Service Workers, PushManager, and Notifications
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') {
    return false // SSR
  }

  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Gets the current push notification permission status
 *
 * @returns Notification permission state: 'default', 'granted', or 'denied'
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }
  return Notification.permission
}

/**
 * Requests push notification permission from the user
 * Shows browser permission prompt
 *
 * @returns Promise resolving to granted permission status (true/false)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported in this browser')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}

/**
 * Subscribes the user to push notifications
 * Requires notification permission to be granted first
 *
 * @returns Promise resolving to PushSubscription or null if failed
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported')
    return null
  }

  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return null
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.error('VAPID public key not configured')
    return null
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      return existingSubscription
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required: all notifications must be shown to user
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

/**
 * Unsubscribes the user from push notifications
 *
 * @returns Promise resolving to true if successfully unsubscribed
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return false
  }
}

/**
 * Gets the current push subscription if it exists
 *
 * @returns Promise resolving to PushSubscription or null
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error('Error getting push subscription:', error)
    return null
  }
}

/**
 * Saves push subscription to the backend API
 *
 * @param subscription - PushSubscription object from PushManager
 * @returns Promise resolving to true if successfully saved
 */
export async function savePushSubscription(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to save push subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return false
  }
}

/**
 * Removes push subscription from the backend API
 *
 * @returns Promise resolving to true if successfully removed
 */
export async function removePushSubscription(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to remove push subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return false
  }
}

/**
 * Complete flow to enable push notifications
 * 1. Requests permission
 * 2. Subscribes to push
 * 3. Saves subscription to backend
 *
 * @returns Promise resolving to true if successfully enabled
 */
export async function enablePushNotifications(): Promise<boolean> {
  // Request permission
  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) {
    return false
  }

  // Subscribe to push
  const subscription = await subscribeToPush()
  if (!subscription) {
    return false
  }

  // Save to backend
  const saved = await savePushSubscription(subscription)
  return saved
}

/**
 * Complete flow to disable push notifications
 * 1. Removes subscription from backend
 * 2. Unsubscribes from push
 *
 * @returns Promise resolving to true if successfully disabled
 */
export async function disablePushNotifications(): Promise<boolean> {
  // Remove from backend
  const removed = await removePushSubscription()

  // Unsubscribe from push (even if backend removal failed)
  const unsubscribed = await unsubscribeFromPush()

  return removed && unsubscribed
}
