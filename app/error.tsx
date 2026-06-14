// app/error.tsx — must be a client component, no Supabase
'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  console.error('[auth/callback]', error?.message)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Something went wrong</h1>
      <p className="text-gray-500 mb-8">An unexpected error occurred. Please try again.</p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="text-sm font-semibold text-white px-6 py-3 rounded-xl hover:opacity-90"
          style={{ background: '#1D9E75' }}>
          Try again
        </button>
        <Link href="/"
          className="text-sm font-semibold border-2 px-6 py-3 rounded-xl hover:opacity-80"
          style={{ borderColor: '#1D9E75', color: '#1D9E75' }}>
          Go home
        </Link>
      </div>
    </div>
  )
}

