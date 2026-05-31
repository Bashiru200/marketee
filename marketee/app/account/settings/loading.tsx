export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header skeleton */}
      <div className="text-center mb-12">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-3" style={{ animation: 'pulse 2s infinite' }} />
        <div className="h-4 w-96 max-w-full bg-gray-100 rounded mx-auto" style={{ animation: 'pulse 2s infinite' }} />
      </div>

      {/* Settings form sections skeleton */}
      <div className="space-y-8">
        {[1, 2, 3].map(section => (
          <div key={section} className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Section title skeleton */}
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" style={{ animation: 'pulse 2s infinite' }} />
            
            {/* Form fields skeleton */}
            <div className="space-y-4">
              {[1, 2].map(field => (
                <div key={field}>
                  <div className="h-3 w-24 bg-gray-100 rounded mb-2" style={{ animation: 'pulse 2s infinite' }} />
                  <div className="h-10 w-full bg-gray-100 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save button skeleton */}
      <div className="mt-8">
        <div className="h-11 w-32 bg-green-500 rounded-xl" style={{ animation: 'pulse 2s infinite' }} />
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
