'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home } from 'lucide-react'

export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
          Please try again or return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: '#1D9E75' }}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link href="/"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 px-6 py-3 rounded-xl border border-gray-200 hover:border-green-300 transition-colors">
            <Home size={16} /> Go home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-6">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}