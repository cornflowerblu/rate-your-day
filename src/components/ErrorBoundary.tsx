'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary component - Catches and handles React errors gracefully
 *
 * Features:
 * - Catches errors in child components
 * - Displays user-friendly error UI
 * - Logs errors for debugging
 * - Provides "Try again" functionality
 * - Prevents entire app crash
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Store error info in state
    this.setState({
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // logErrorToService(error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-elevated p-8 border border-gray-200 dark:border-gray-800">
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-3">
              Something went wrong
            </h1>

            {/* Error description */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe. Please try again.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-mono overflow-auto">
                  <p className="font-bold text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary px-6 py-3 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-6 py-3 text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                Reload Page
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="btn-ghost px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200"
              >
                Go to Home
              </button>
            </div>

            {/* Help text */}
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-500">
              If this problem persists, please contact support or try clearing your browser cache.
            </p>
          </div>
        </div>
      )
    }

    // Render children normally when no error
    return this.props.children
  }
}

export default ErrorBoundary
