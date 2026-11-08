export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="skeleton h-7 w-7 rounded-lg" />
        <div className="skeleton h-7 w-40 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton-card rounded-2xl border p-5">
            <div className="flex items-start gap-4">
              <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
