export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl overflow-hidden flex" style={{ minHeight: '560px' }}>
        {/* Left brand panel skeleton */}
        <div className="hidden lg:flex flex-col w-2/5 p-10" style={{ background: '#085041' }}>
          <div className="space-y-8">
            {/* Logo skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-6 w-32 rounded bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            {/* Heading skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-green-200" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-6 w-48 rounded bg-green-200" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-4 w-44 rounded bg-green-100" style={{ animation: 'pulse 2s infinite' }} />
            </div>
          </div>
        </div>

        {/* Right form panel skeleton */}
        <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
          {/* Form title skeleton */}
          <div className="h-7 w-48 bg-gray-200 rounded mb-8" style={{ animation: 'pulse 2s infinite' }} />

          {/* Form fields skeleton */}
          <div className="space-y-4 mb-6">
            {[1, 2].map(i => (
              <div key={i}>
                <div className="h-3 w-24 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                <div className="h-10 w-full bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
              </div>
            ))}
          </div>

          {/* Submit button skeleton */}
          <div className="h-11 w-full bg-green-500 rounded-xl mb-4" style={{ animation: 'pulse 2s infinite' }} />

          {/* Link skeleton */}
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto" style={{ animation: 'pulse 2s infinite' }} />
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
