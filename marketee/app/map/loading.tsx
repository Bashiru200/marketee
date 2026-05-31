export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map skeleton - full width hero */}
      <div className="w-full h-96 bg-gray-200" style={{ animation: 'pulse 2s infinite' }} />

      {/* Controls and info skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar controls skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              {/* Search bar skeleton */}
              <div className="h-10 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
              
              {/* Filter buttons skeleton */}
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          </div>

          {/* Main content area skeleton */}
          <div className="lg:col-span-3">
            {/* View toggle buttons skeleton */}
            <div className="flex gap-2 mb-4">
              <div className="h-10 w-12 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-10 w-12 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            {/* Results count skeleton */}
            <div className="h-4 w-40 bg-gray-100 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />

            {/* Business cards grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Image skeleton */}
                  <div className="h-32 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
                  
                  {/* Content skeleton */}
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-24 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                    <div className="h-3 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                    <div className="h-3 w-20 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                    <div className="h-8 w-full bg-gray-100 rounded-lg mt-2" style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
