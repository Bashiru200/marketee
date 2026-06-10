export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="h-6 w-32 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      </div>

      {/* Page header skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-3" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-4 w-96 max-w-full bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Content grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {/* Image skeleton */}
              <div className="h-40 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
              
              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                {/* Title skeleton */}
                <div className="h-4 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Category/Info skeleton */}
                <div className="h-3 w-24 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Location skeleton */}
                <div className="h-3 w-28 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Rating skeleton */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className="w-3 h-3 bg-gray-100 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                    ))}
                  </div>
                  <div className="h-3 w-12 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              </div>
            </div>
          ))}
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
