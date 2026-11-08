export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF7EF] p-4 sm:p-6 lg:p-8">
      <div className="grid min-h-[560px] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#E7DDCA] bg-white shadow-xl shadow-[#053528]/5 lg:grid-cols-[410px_minmax(0,1fr)]">
        <div className="hidden bg-[#085041] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-white/20" />
              <div className="h-6 w-32 rounded bg-white/20" />
            </div>
            <div className="space-y-3">
              <div className="h-8 w-56 rounded bg-white/20" />
              <div className="h-8 w-64 rounded bg-white/20" />
              <div className="h-4 w-60 rounded bg-white/15" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-20 rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="skeleton mb-8 h-8 w-56 rounded-xl" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item}>
                <div className="skeleton mb-2 h-3 w-24 rounded" />
                <div className="skeleton h-12 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="mt-6 h-12 rounded-xl bg-[#085041]" />
          <div className="my-6 flex items-center gap-3">
            <div className="skeleton h-px flex-1" />
            <div className="skeleton h-3 w-8 rounded" />
            <div className="skeleton h-px flex-1" />
          </div>
          <div className="skeleton h-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
