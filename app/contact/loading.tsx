export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <div className="skeleton mx-auto mb-3 h-10 w-56 rounded-xl" />
        <div className="skeleton mx-auto h-5 w-96 max-w-full rounded" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton-card rounded-2xl border p-5">
              <div className="flex items-start gap-4">
                <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-4 w-36 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="skeleton-card rounded-2xl border p-6 lg:col-span-2">
          <div className="skeleton mb-5 h-5 w-40 rounded" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item}>
                  <div className="skeleton mb-2 h-3 w-20 rounded" />
                  <div className="skeleton h-11 rounded-xl" />
                </div>
              ))}
            </div>
            <div>
              <div className="skeleton mb-2 h-3 w-16 rounded" />
              <div className="skeleton h-11 rounded-xl" />
            </div>
            <div>
              <div className="skeleton mb-2 h-3 w-20 rounded" />
              <div className="skeleton h-36 rounded-xl" />
            </div>
            <div className="h-11 w-36 rounded-xl bg-[#1D9E75]" />
          </div>
        </div>
      </div>
    </div>
  )
}
