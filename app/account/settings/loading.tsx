export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="skeleton h-7 w-7 rounded-lg" />
        <div className="skeleton h-7 w-32 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="skeleton-card overflow-hidden rounded-2xl border">
            <div className="border-b border-[#E7DDCA] px-5 py-4">
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="divide-y divide-[#E7DDCA]">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-8 w-8 rounded-lg" />
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-32 rounded" />
                      <div className="skeleton h-3 w-48 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
