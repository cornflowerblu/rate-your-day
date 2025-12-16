'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/signin', redirect: true })
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect to signin page even if there's an error
      window.location.href = '/auth/signin'
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="btn-ghost px-4 py-2 text-sm font-medium flex items-center gap-2"
      title="Sign out of your account"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  )
}
