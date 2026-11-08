export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="sticky top-0 z-40 border-b border-[#E7DDCA] bg-[#FBF7EF]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="flex gap-3">
            <div className="skeleton h-10 w-24 rounded-lg" />
            <div className="skeleton h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="skeleton mb-3 h-8 w-48 rounded" />
          <div className="skeleton h-4 w-96 max-w-full rounded" />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="skeleton-card h-12 flex-1 rounded-xl border" />
          <div className="skeleton-card h-12 rounded-xl border sm:w-52" />
          <div className="skeleton-card h-12 rounded-xl border sm:w-32" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton-card overflow-hidden rounded-2xl border">
              <div className="skeleton h-40" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="skeleton h-3 w-3 rounded-full" />
                  ))}
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
                <div className="h-9 rounded-xl bg-[#085041]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
