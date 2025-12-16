import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { MoodLevel } from './types'

// Type declaration for Background Sync API (not in standard TypeScript types)
interface SyncManager {
  register(tag: string): Promise<void>
  getTags(): Promise<string[]>
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager
}

// Type guard to check if Background Sync is supported
function hasBackgroundSync(
  registration: ServiceWorkerRegistration
): registration is ServiceWorkerRegistrationWithSync {
  return 'sync' in registration
}

// Define the database schema
interface RateYourDayDB extends DBSchema {
  'pending-ratings': {
    key: string // date in YYYY-MM-DD format
    value: {
      date: string
      rating: MoodLevel
      notes?: string
      timestamp: number
    }
  }
  ratings: {
    key: string // date in YYYY-MM-DD format
    value: {
      date: string
      rating: MoodLevel
      notes?: string
      updatedAt: number
    }
  }
}

const DB_NAME = 'rate-your-day'
const DB_VERSION = 2 // Bumped for Mongoose migration

// Cache the database promise to avoid multiple initializations
let dbPromise: Promise<IDBPDatabase<RateYourDayDB>> | null = null

/**
 * Initialize the IndexedDB database
 * Creates two object stores:
 * - pending-ratings: Queue for offline changes waiting to sync
 * - ratings: Cache of successfully synced ratings for offline access
 */
function initDB(): Promise<IDBPDatabase<RateYourDayDB>> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = openDB<RateYourDayDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create pending-ratings store for offline queue
      if (!db.objectStoreNames.contains('pending-ratings')) {
        db.createObjectStore('pending-ratings', { keyPath: 'date' })
      }

      // Create ratings store for cached data
      if (!db.objectStoreNames.contains('ratings')) {
        db.createObjectStore('ratings', { keyPath: 'date' })
      }
    },
  })

  return dbPromise
}

/**
 * Save a pending rating to IndexedDB when offline
 * This will be synced when the connection is restored
 */
export async function savePendingRating(
  date: string,
  rating: MoodLevel,
  notes?: string
): Promise<void> {
  const db = await initDB()

  await db.put('pending-ratings', {
    date,
    rating,
    notes,
    timestamp: Date.now(),
  })

  // Notify any listeners about pending count update
  notifyPendingCountUpdate()

  // Try to register background sync if available
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if (hasBackgroundSync(registration)) {
        await registration.sync.register('sync-ratings')
        console.log('Background sync registered for rating:', date)
      }
    } catch (error) {
      console.error('Failed to register background sync:', error)
    }
  }
}

/**
 * Get all pending ratings waiting to sync
 */
export async function getPendingRatings(): Promise<
  Array<{
    date: string
    rating: MoodLevel
    notes?: string
    timestamp: number
  }>
> {
  const db = await initDB()
  return db.getAll('pending-ratings')
}

/**
 * Remove a pending rating after successful sync
 */
export async function removePendingRating(date: string): Promise<void> {
  const db = await initDB()
  await db.delete('pending-ratings', date)
  notifyPendingCountUpdate()
}

/**
 * Get count of pending ratings
 */
export async function getPendingCount(): Promise<number> {
  const db = await initDB()
  const count = await db.count('pending-ratings')
  return count
}

/**
 * Cache a rating for offline access
 */
export async function cacheRating(date: string, rating: MoodLevel, notes?: string): Promise<void> {
  const db = await initDB()

  await db.put('ratings', {
    date,
    rating,
    notes,
    updatedAt: Date.now(),
  })
}

/**
 * Get a cached rating from IndexedDB
 * Useful for offline access
 */
export async function getCachedRating(date: string): Promise<{
  date: string
  rating: MoodLevel
  notes?: string
  updatedAt: number
} | null> {
  const db = await initDB()
  const rating = await db.get('ratings', date)
  return rating || null
}

/**
 * Get all cached ratings
 */
export async function getAllCachedRatings(): Promise<
  Array<{
    date: string
    rating: MoodLevel
    notes?: string
    updatedAt: number
  }>
> {
  const db = await initDB()
  return db.getAll('ratings')
}

/**
 * Clear all cached ratings
 * Useful for logout or data reset
 */
export async function clearCachedRatings(): Promise<void> {
  const db = await initDB()
  await db.clear('ratings')
}

/**
 * Clear all pending ratings
 * Use with caution - typically only for debugging or after successful sync
 */
export async function clearPendingRatings(): Promise<void> {
  const db = await initDB()
  await db.clear('pending-ratings')
  notifyPendingCountUpdate()
}

/**
 * Check if a rating is pending sync
 */
export async function isPendingSync(date: string): Promise<boolean> {
  const db = await initDB()
  const pending = await db.get('pending-ratings', date)
  return !!pending
}

/**
 * Notify listeners about pending count update
 * This allows the UI to update the offline indicator
 */
async function notifyPendingCountUpdate(): Promise<void> {
  const count = await getPendingCount()

  // Post message to service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PENDING_COUNT_UPDATE',
      count,
    })
  }

  // Dispatch custom event for components
  window.dispatchEvent(
    new CustomEvent('pendingCountUpdate', {
      detail: { count },
    })
  )
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Initialize database on module load
 * This ensures the database is ready when needed
 */
if (typeof window !== 'undefined') {
  initDB().catch((error) => {
    console.error('Failed to initialize IndexedDB:', error)
  })
}
