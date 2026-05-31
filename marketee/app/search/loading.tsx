export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar skeleton */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="flex-1 h-10 bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
          <div className="w-36 h-10 bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
          <div className="w-24 h-10 bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="flex-1">
          <div className="h-5 w-40 bg-gray-100 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-36 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-3 bg-gray-100 rounded w-2/3" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-3 bg-gray-100 rounded w-1/2" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-8 bg-gray-100 rounded-lg mt-3" style={{ animation: 'pulse 2s infinite' }} />
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