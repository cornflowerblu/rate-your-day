'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Register service worker for offline support, push notifications, and PWA installation
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Handle service worker updates silently (no Chrome notification)
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available - log but don't notify user
                  console.log('Service worker updated in background')
                  // Optionally: You could show a subtle in-app banner here instead
                }
              })
            }
          })

          // Check for updates every hour (production only)
          if (process.env.NODE_ENV === 'production') {
            setInterval(
              () => {
                registration.update()
              },
              60 * 60 * 1000
            )
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return <SessionProvider>{children}</SessionProvider>
}
