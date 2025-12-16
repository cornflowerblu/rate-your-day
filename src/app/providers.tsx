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
