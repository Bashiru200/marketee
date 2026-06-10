export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="py-20 px-4" style={{ background: '#085041' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-6 w-48 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)', animation: 'pulse 2s infinite' }} />
          <div className="h-12 w-96 max-w-full rounded-xl mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)', animation: 'pulse 2s infinite' }} />
          <div className="h-5 w-80 max-w-full rounded mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.1)', animation: 'pulse 2s infinite' }} />
          <div className="h-14 max-w-xl mx-auto rounded-2xl" style={{ background: 'rgba(255,255,255,0.2)', animation: 'pulse 2s infinite' }} />
        </div>
      </div>

      {/* Stats skeleton */}
      <div style={{ background: '#053528' }} className="py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="text-center">
              <div className="h-8 w-16 rounded mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.2)', animation: 'pulse 2s infinite' }} />
              <div className="h-3 w-24 rounded mx-auto" style={{ background: 'rgba(255,255,255,0.1)', animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-100 rounded mb-8" style={{ animation: 'pulse 2s infinite' }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="h-8 w-8 bg-gray-100 rounded mx-auto mb-3" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-4 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 rounded mb-8" style={{ animation: 'pulse 2s infinite' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-44 bg-gray-200" style={{ animation: 'pulse 2s infinite' }} />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-9 bg-gray-100 rounded-lg mt-3" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Skeleton */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="h-10 w-32 bg-gray-200 rounded mb-6" style={{ animation: 'pulse 2s infinite' }} />
        <div className="flex items-center space-x-6 mb-10">
          <div className="h-24 w-24 bg-gray-200 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
          <div>
            <div className="h-5 w-32 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-4 w-20 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
          </div>
        </div>
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
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