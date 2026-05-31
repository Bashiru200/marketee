export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-40 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-6 w-24 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Profile card skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="p-6 space-y-6">
          {/* Avatar skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded" style={{ animation: 'pulse 2s infinite' }} />
                <div className="h-4 w-24 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-6 w-12 bg-gray-200 rounded mx-auto mb-1" style={{ animation: 'pulse 2s infinite' }} />
                <div className="h-3 w-16 bg-gray-100 rounded mx-auto" style={{ animation: 'pulse 2s infinite' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Name field skeleton */}
          <div>
            <div className="h-4 w-20 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-full bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
          </div>

          {/* City field skeleton */}
          <div>
            <div className="h-4 w-16 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-full bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
          </div>

          {/* Buttons skeleton */}
          <div className="flex gap-2 pt-4">
            <div className="h-10 w-24 bg-green-500 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
            <div className="h-10 w-20 bg-gray-100 rounded-lg" style={{ animation: 'pulse 2s infinite' }} />
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
