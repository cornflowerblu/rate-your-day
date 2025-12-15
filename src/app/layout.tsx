import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rate Your Day',
  description: 'Track your daily mood with simple emoji ratings',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
