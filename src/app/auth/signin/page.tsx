import { signIn } from '@/lib/auth'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  const callbackUrl = searchParams.callbackUrl || '/'
  const error = searchParams.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">😊</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Your Day</h1>
          <p className="text-gray-600">Track your daily mood with simple emoji ratings</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              {error === 'OAuthSignin' && 'Error signing in with Microsoft'}
              {error === 'OAuthCallback' && 'Error processing sign in'}
              {error === 'OAuthCreateAccount' && 'Could not create account'}
              {error === 'EmailCreateAccount' && 'Could not create account'}
              {error === 'Callback' && 'Sign in callback error'}
              {error === 'OAuthAccountNotLinked' && 'Account is linked to a different provider'}
              {error === 'EmailSignin' && 'Check your email for the sign in link'}
              {error === 'CredentialsSignin' && 'Sign in failed. Check your credentials'}
              {error === 'SessionRequired' && 'Please sign in to access this page'}
              {error === 'AccessDenied' && 'Access denied. You are not authorized to use this app.'}
              {!error.match(/OAuth|Email|Credentials|Session|Access/) && 'Sign in error'}
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
            className="w-full bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#00a4ef" />
              <rect x="1" y="11" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Only authorized users can access this app
        </p>
      </div>
    </div>
  )
}
