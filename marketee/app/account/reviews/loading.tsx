export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-6 h-6 rounded bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-6 w-32 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-4 w-12 bg-gray-100 rounded ml-1" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Reviews list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-4">
              {/* Review image skeleton */}
              <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
              
              <div className="flex-1 min-w-0">
                {/* Business name skeleton */}
                <div className="h-4 w-40 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Rating skeleton */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(j => (
                      <div key={j} className="w-3 h-3 bg-gray-100 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                    ))}
                  </div>
                  <div className="h-3 w-20 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
                
                {/* Review title skeleton */}
                <div className="h-4 w-48 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Review text skeleton */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
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
