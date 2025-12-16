// Service Worker for Rate Your Day PWA
// Enhanced with offline support and background sync

const CACHE_VERSION = 'v3'
const CACHE_NAME = `rate-your-day-${CACHE_VERSION}`
const STATIC_CACHE_NAME = `rate-your-day-static-${CACHE_VERSION}`
const API_CACHE_NAME = `rate-your-day-api-${CACHE_VERSION}`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
]

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.error('Failed to cache some static assets:', error)
          // Continue even if some assets fail
        })
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(
    // Clean up old caches
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Handle API requests with stale-while-revalidate
  if (request.url.includes('/api/ratings')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful GET responses (not 404, not POST/DELETE)
            if (networkResponse.ok && request.method === 'GET') {
              try {
                // Clone the response before caching (response can only be read once)
                const responseToCache = networkResponse.clone()
                cache.put(request, responseToCache).catch((err) => {
                  console.warn('Failed to cache response:', err)
                })
              } catch (err) {
                console.warn('Failed to clone response:', err)
              }
            }
            return networkResponse
          })
          .catch(() => {
            // If offline, try to return cached response
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log('Serving cached API response for:', request.url)
                return cachedResponse
              }
              // Return offline indicator if no cache available
              return new Response(JSON.stringify({ error: 'Offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              })
            })
          })
      })
    )
    return
  }

  // Handle other API requests (non-ratings)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              try {
                const responseToCache = networkResponse.clone()
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache).catch(() => {
                    // Ignore cache errors in background update
                  })
                })
              } catch (err) {
                // Ignore clone errors in background update
              }
            }
          })
          .catch(() => {
            // Ignore network errors for background updates
          })
        return cachedResponse
      }

      // If not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.ok) {
            try {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache).catch(() => {
                  // Ignore cache errors
                })
              })
            } catch (err) {
              // Ignore clone errors
            }
          }
          return networkResponse
        })
        .catch(() => {
          // If offline and not cached, show offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'Time to rate your day!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'daily-reminder',
    requireInteraction: data.requireInteraction || false,
    data: data.data || { url: '/' },
    actions: [
      {
        action: 'rate',
        title: 'Rate Now',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title || 'Rate Your Day', options))
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Get URL from notification data or default to home
  const urlToOpen = event.notification.data?.url || '/'

  // Open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen)
            }
          })
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// Background sync for offline rating saves
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncPendingRatings())
  }
})

/**
 * Sync pending ratings from IndexedDB to the API
 * Uses exponential backoff for retries
 */
async function syncPendingRatings() {
  console.log('Background sync: Starting to sync pending ratings')

  try {
    // Import idb library
    const { openDB } = await import('https://cdn.jsdelivr.net/npm/idb@8/+esm')

    // Open IndexedDB
    const db = await openDB('rate-your-day', 1)
    const pending = await db.getAll('pending-ratings')

    if (pending.length === 0) {
      console.log('Background sync: No pending ratings to sync')
      return
    }

    console.log(`Background sync: Found ${pending.length} pending rating(s)`)

    let successCount = 0
    let failCount = 0

    // Sync each pending rating
    for (const item of pending) {
      try {
        const response = await fetch(`/api/ratings/${item.date}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: item.rating,
            notes: item.notes,
          }),
        })

        if (response.ok) {
          // Remove from IndexedDB after successful sync
          await db.delete('pending-ratings', item.date)
          successCount++
          console.log(`Background sync: Successfully synced rating for ${item.date}`)
        } else {
          failCount++
          console.error(
            `Background sync: Failed to sync rating for ${item.date} - Status ${response.status}`
          )
        }
      } catch (error) {
        failCount++
        console.error(`Background sync: Network error syncing rating for ${item.date}:`, error)
        // Keep in queue for next sync attempt
      }
    }

    console.log(`Background sync complete: ${successCount} synced, ${failCount} failed`)

    // Notify all clients about sync completion
    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount: successCount,
        failedCount: failCount,
      })
    }
  } catch (error) {
    console.error('Background sync: Fatal error during sync:', error)
    throw error // Re-throw to trigger retry
  }
}
