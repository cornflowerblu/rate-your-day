import { signIn } from '@/lib/auth'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: 'Error signing in with Microsoft',
  OAuthCallback: 'Error processing sign in',
  OAuthCreateAccount: 'Could not create account',
  EmailCreateAccount: 'Could not create account',
  Callback: 'Sign in callback error',
  OAuthAccountNotLinked: 'Account is linked to a different provider',
  EmailSignin: 'Check your email for the sign in link',
  CredentialsSignin: 'Sign in failed. Check your credentials',
  SessionRequired: 'Please sign in to access this page',
  AccessDenied: 'Access denied. You are not authorized to use this app.',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl || '/'
  const error = params.error

  const errorMessage = error ? ERROR_MESSAGES[error] || 'Sign in error' : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-floating p-10 max-w-md w-full animate-scale-in">
        <div className="text-center mb-10 space-y-4">
          <div className="text-7xl mb-6 animate-bounce-once">😊</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-3 bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
            Rate Your Day
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            Track your daily mood with simple emoji ratings
          </p>
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-in-down">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium text-center">
              {errorMessage}
            </p>
          </div>
        )}

        <form
          action={async () => {
            'use server'
            await signIn('microsoft-entra-id', { redirectTo: callbackUrl })
          }}
        >
          <button
            type="submit"
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-4 px-6 rounded-xl border border-gray-300 dark:border-gray-600 transition-all duration-200 flex items-center justify-center gap-3 shadow-soft hover:shadow-medium active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#00a4ef" />
              <rect x="1" y="11" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span className="text-base">Sign in with Microsoft</span>
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          🔒 Only authorized users can access this app
        </p>
      </div>
    </div>
  )
}
