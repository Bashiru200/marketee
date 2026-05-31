export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-6 h-6 rounded bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-6 w-40 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-4 w-12 bg-gray-100 rounded ml-1" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Saved businesses grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Image skeleton */}
            <div className="h-40 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              {/* Title skeleton */}
              <div className="h-4 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
              
              {/* Category skeleton */}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
