export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="skeleton h-7 w-7 rounded-lg" />
        <div className="skeleton h-7 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="skeleton-card overflow-hidden rounded-2xl border">
            <div className="skeleton h-40" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
