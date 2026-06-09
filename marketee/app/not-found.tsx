import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'

export default function BusinessNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          This listing may have been removed, or the link is incorrect.
          Discover other great African businesses below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: '#1D9E75' }}>
            <Search size={16} /> Browse businesses
          </Link>
          <Link href="/map"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 px-6 py-3 rounded-xl border border-gray-200 hover:border-green-300 transition-colors">
            <MapPin size={16} /> View on map
          </Link>
        </div>
      </div>
    </div>
  )
}