export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-6 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero/Cover image skeleton */}
        <div className="h-64 w-full bg-gray-100 rounded-2xl mb-8" style={{ animation: 'pulse 2s infinite' }} />

        {/* Business info section skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Logo skeleton */}
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" style={{ animation: 'pulse 2s infinite' }} />
              
              <div className="flex-1">
                {/* Business name skeleton */}
                <div className="h-6 w-48 bg-gray-200 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Category and rating skeleton */}
                <div className="h-4 w-32 bg-gray-100 rounded mb-3" style={{ animation: 'pulse 2s infinite' }} />
                
                {/* Rating stars skeleton */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-4 h-4 bg-gray-100 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                    ))}
                  </div>
                  <div className="h-4 w-24 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-10 w-10 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            </div>
          </div>

          {/* Contact info skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        </div>

        {/* Description skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-4 w-full bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-4 w-2/3 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>

        {/* Reviews skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-4 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
                <div className="h-4 w-full bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                <div className="h-4 w-2/3 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
              </div>
            ))}
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
