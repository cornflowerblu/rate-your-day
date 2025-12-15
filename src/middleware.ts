import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Protect all routes except auth pages and public assets
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublicPath =
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/auth') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname === '/favicon.svg' ||
    req.nextUrl.pathname === '/favicon.ico' ||
    req.nextUrl.pathname === '/manifest.json' ||
    req.nextUrl.pathname.startsWith('/icons') ||
    req.nextUrl.pathname === '/sw.js' ||
    req.nextUrl.pathname === '/offline.html' ||
    req.nextUrl.pathname.startsWith('/workbox-')

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Redirect to sign in if not logged in
  if (!isLoggedIn) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check if user is the owner
  const ownerEmail = process.env.OWNER_EMAIL
  if (ownerEmail && req.auth?.user?.email !== ownerEmail) {
    return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
