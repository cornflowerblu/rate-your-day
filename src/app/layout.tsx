import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rate Your Day',
  description: 'Track your daily mood with simple emoji ratings',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rate Your Day',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192x192.svg',
  },
}

export function generateViewport() {
  return {
    themeColor: '#3b82f6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
