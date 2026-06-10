export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header skeleton */}
      <div className="text-center mb-12">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-3" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-4 w-96 max-w-full bg-gray-100 rounded mx-auto" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Contact info and form skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left contact info skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gray-100" style={{ animation: 'pulse 2s infinite' }} />
                <div className="flex-1">
                  <div className="h-3 w-20 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-4 w-32 bg-gray-100 rounded" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right form skeleton */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
          
          {/* Form fields skeleton */}
          <div className="space-y-4">
            {/* Name and email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i}>
                  <div className="h-3 w-20 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-10 w-full bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              ))}
            </div>

            {/* Subject */}
            <div>
              <div className="h-3 w-16 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-10 w-full bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            {/* Message textarea */}
            <div>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
              <div className="h-32 w-full bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
            </div>

            {/* Submit button */}
            <div className="h-10 w-32 bg-green-500 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
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
