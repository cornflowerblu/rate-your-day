import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  let errorMessage = 'An error occurred during authentication.'
  let errorDescription = 'Please try again or contact support if the issue persists.'

  switch (error) {
    case 'Configuration':
      errorMessage = 'Server configuration error'
      errorDescription = 'There is a problem with the server authentication configuration.'
      break
    case 'AccessDenied':
      errorMessage = 'Access Denied'
      errorDescription =
        'You do not have permission to access this application. This app is restricted to the owner only.'
      break
    case 'Verification':
      errorMessage = 'Verification failed'
      errorDescription = 'The sign in link has expired or has already been used.'
      break
    default:
      errorMessage = 'Authentication error'
      errorDescription = 'An unexpected error occurred. Please try signing in again.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-floating p-10 max-w-md w-full animate-scale-in">
        <div className="text-center mb-10 space-y-4">
          <div className="text-7xl mb-6 animate-bounce-once">⚠️</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
            {errorMessage}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{errorDescription}</p>
        </div>

        {error === 'AccessDenied' && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl animate-slide-in-down">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
              <strong>Note:</strong> This is a personal mood tracking app restricted to the owner.
              If you believe you should have access, please contact the app owner.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full btn-primary py-4 rounded-xl font-semibold text-base text-center shadow-soft hover:shadow-medium active:scale-95"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full btn-secondary py-4 rounded-xl font-semibold text-base text-center shadow-soft hover:shadow-medium active:scale-95"
          >
            Go Home
          </Link>
        </div>

        {error && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Error code: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
