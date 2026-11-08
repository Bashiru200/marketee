export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="skeleton h-7 w-28 rounded-lg" />
        <div className="skeleton h-5 w-20 rounded" />
      </div>

      <div className="skeleton-card mb-4 overflow-hidden rounded-2xl border">
        <div className="h-24 bg-[#085041]/20" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-5 flex items-end justify-between">
            <div className="skeleton h-20 w-20 rounded-full border-4 border-white" />
            <div className="skeleton h-9 w-28 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-6 w-40 rounded" />
            <div className="skeleton h-4 w-52 rounded" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card rounded-2xl border p-4 text-center">
            <div className="skeleton mx-auto mb-2 h-5 w-5 rounded" />
            <div className="skeleton mx-auto mb-1 h-6 w-10 rounded" />
            <div className="skeleton mx-auto h-3 w-14 rounded" />
          </div>
        ))}
      </div>

      <div className="skeleton-card overflow-hidden rounded-2xl border">
        <div className="border-b border-[#E7DDCA] px-5 py-4">
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 border-b border-[#E7DDCA] px-5 py-4">
            <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-3 w-52 rounded" />
            </div>
            <div className="skeleton h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
