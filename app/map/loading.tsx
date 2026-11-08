export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#FBF7EF]">
      <div className="border-b border-[#E7DDCA] bg-[#FBF7EF]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="skeleton-card h-11 flex-1 rounded-2xl border" />
          <div className="skeleton-card hidden h-11 w-40 rounded-2xl border sm:block" />
          <div className="skeleton-card h-11 w-24 rounded-2xl border" />
        </div>
        <div className="mx-auto mt-2 flex max-w-7xl gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="skeleton h-8 w-28 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="map-bg relative flex-1">
          <div className="absolute left-[18%] top-[22%] h-10 w-24 rounded-full bg-[#085041]" />
          <div className="absolute left-[55%] top-[38%] h-10 w-24 rounded-full bg-[#085041]" />
          <div className="absolute left-[36%] top-[66%] h-10 w-24 rounded-full bg-[#085041]" />
        </div>
        <aside className="skeleton-card hidden w-80 border-l md:block">
          <div className="border-b border-[#E7DDCA] p-4">
            <div className="skeleton h-5 w-36 rounded" />
          </div>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex gap-3 border-b border-[#E7DDCA] p-4">
              <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
