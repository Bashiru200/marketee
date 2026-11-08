export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBF7EF] px-4 py-8 dark:bg-[#07130f]">
      <div className="mx-auto max-w-7xl">
        <div className="skeleton-card mb-5 flex w-fit gap-1 rounded-2xl border p-1 shadow-sm">
          <div className="h-11 w-36 rounded-xl bg-[#1D9E75]" />
          <div className="skeleton h-11 w-32 rounded-xl" />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="skeleton-card h-12 flex-1 rounded-xl border shadow-sm" />
          <div className="skeleton-card h-12 rounded-xl border shadow-sm sm:w-52" />
          <div className="skeleton-card h-12 rounded-xl border shadow-sm sm:w-32" />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton-card h-10 w-40 rounded-xl border" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton-card overflow-hidden rounded-3xl border shadow-sm">
              <div className="skeleton h-48" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-4/5 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-px w-full rounded" />
                <div className="flex items-center justify-between">
                  <div className="skeleton h-5 w-28 rounded" />
                  <div className="h-9 w-16 rounded-xl bg-[#085041]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
