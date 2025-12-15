import Link from 'next/link'

export default function AuthErrorPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-pink-500 to-purple-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{errorMessage}</h1>
          <p className="text-gray-600">{errorDescription}</p>
        </div>

        {error === 'AccessDenied' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This is a personal mood tracking app restricted to the owner.
              If you believe you should have access, please contact the app owner.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
          >
            Go Home
          </Link>
        </div>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Error code: {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
