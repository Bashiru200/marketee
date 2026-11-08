export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#E7DDCA] bg-[#FBF7EF]/95 px-4 py-3 backdrop-blur">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="skeleton h-5 w-36 rounded" />
        <div className="skeleton h-4 w-10 rounded" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:flex lg:gap-6">
        <aside className="skeleton-card hidden w-72 shrink-0 rounded-3xl border p-4 lg:block">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#085041]" />
            <div className="space-y-2">
              <div className="skeleton h-5 w-28 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div key={item} className="skeleton h-10 rounded-xl" />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-8 hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#085041]" />
              <div className="space-y-2">
                <div className="skeleton h-7 w-48 rounded" />
                <div className="skeleton h-4 w-52 rounded" />
              </div>
            </div>
            <div className="skeleton h-5 w-24 rounded" />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton-card rounded-2xl border p-5">
                <div className="skeleton mb-3 h-5 w-5 rounded" />
                <div className="skeleton mb-2 h-8 w-16 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            ))}
          </div>

          <div className="skeleton-card overflow-hidden rounded-2xl border">
            <div className="flex flex-col gap-3 border-b border-[#E7DDCA] p-4 sm:flex-row">
              <div className="skeleton h-10 flex-1 rounded-xl" />
              <div className="skeleton h-10 w-48 rounded-xl" />
            </div>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex items-center gap-4 border-b border-[#E7DDCA] p-4">
                <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48 max-w-full rounded" />
                  <div className="skeleton h-3 w-64 max-w-full rounded" />
                </div>
                <div className="hidden gap-1.5 sm:flex">
                  {[1, 2, 3].map((action) => (
                    <div key={action} className="skeleton h-8 w-8 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
