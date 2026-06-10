// app/not-found.tsx — keep this simple, no Supabase
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">🌍</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        style={{ background: '#1D9E75' }}>
        Back to home
      </Link>
    </div>
  )
}