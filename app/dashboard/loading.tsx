export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[#E7DDCA] bg-[#FBF7EF]/95 px-4 py-4 backdrop-blur">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
        <div className="skeleton h-9 w-16 rounded-lg" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        <div className="flex items-start gap-6">
          <aside className="skeleton-card sticky top-6 hidden h-fit w-60 shrink-0 overflow-hidden rounded-2xl border lg:block">
            <div className="space-y-2 p-4">
              <div className="skeleton h-10 rounded-xl" />
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="skeleton h-9 rounded-xl" />
              ))}
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-6">
            <div className="hidden items-center gap-3 lg:flex">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-6 w-44 rounded" />
                <div className="skeleton h-4 w-60 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton-card rounded-2xl border p-5">
                  <div className="skeleton mb-3 h-5 w-5 rounded" />
                  <div className="skeleton mb-2 h-8 w-16 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              ))}
            </div>

            <div className="skeleton-card overflow-hidden rounded-2xl border">
              <div className="flex items-center justify-between border-b border-[#E7DDCA] px-5 py-4">
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-5 w-16 rounded" />
              </div>
              <div className="flex gap-4 p-5">
                <div className="skeleton h-20 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="skeleton h-5 w-48 max-w-full rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="skeleton-card rounded-2xl border p-5">
                <div className="skeleton mb-5 h-5 w-40 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="skeleton h-14 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="skeleton-card rounded-2xl border p-5">
                <div className="skeleton mb-5 h-5 w-32 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="skeleton h-4 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
