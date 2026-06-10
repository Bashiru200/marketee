export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      </div>

      {/* Dashboard stats skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="h-4 w-24 bg-gray-100 rounded mb-3" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-8 w-16 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>

        {/* Main content area skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="h-5 w-32 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-12 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
                ))}
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="h-5 w-40 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-24 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="h-5 w-24 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-4 w-full bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                  ))}
                </div>
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
