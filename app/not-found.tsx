// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: '#F8FAF9' }}>
      <div className="text-7xl mb-6">🌍</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/"
          className="px-6 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: '#1D9E75' }}>
          Go home
        </Link>
        <Link href="/search"
          className="px-6 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700">
          Browse businesses
        </Link>
      </div>
    </div>
  )
}