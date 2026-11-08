export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBF7EF] text-gray-950 dark:bg-[#07130f]">
      <section className="border-b border-[#E7DDCA] px-4 py-10 dark:border-[#20362d] sm:px-6 lg:py-14">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="skeleton h-8 w-80 max-w-full rounded-full" />
            <div className="mt-7 space-y-3">
              <div className="skeleton h-16 w-full max-w-2xl rounded-2xl sm:h-20" />
              <div className="skeleton h-16 w-80 max-w-full rounded-2xl sm:h-20" />
            </div>
            <div className="mt-7 max-w-2xl space-y-3">
              <div className="skeleton h-5 w-full rounded" />
              <div className="skeleton h-5 w-5/6 rounded" />
              <div className="skeleton h-5 w-2/3 rounded" />
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#E0D4C0] bg-white p-3 shadow-xl shadow-[#085041]/10 dark:border-[#294239] dark:bg-[#101b17]">
              <div className="grid gap-3 lg:grid-cols-[1fr_0.74fr_0.74fr_auto]">
                <div className="skeleton h-16 rounded-2xl" />
                <div className="skeleton h-16 rounded-2xl" />
                <div className="skeleton h-16 rounded-2xl" />
                <div className="h-16 rounded-2xl bg-[#085041]" />
              </div>
            </div>

            <div className="mt-6 flex gap-5">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-5 w-32 rounded" />
            </div>
          </div>

          <div className="relative min-h-[460px] lg:min-h-[620px]">
            <div className="skeleton absolute left-0 top-6 h-[72%] w-[58%] rounded-[1.75rem] border-8 border-white shadow-2xl dark:border-[#172a23]" />
            <div className="skeleton absolute right-0 top-0 h-[48%] w-[52%] rounded-[1.5rem] border-8 border-white shadow-xl dark:border-[#172a23]" />
            <div className="skeleton absolute bottom-4 right-4 h-[43%] w-[58%] rounded-[1.5rem] border-8 border-white shadow-xl dark:border-[#172a23]" />
            <div className="skeleton-card absolute bottom-0 left-5 h-24 w-64 rounded-2xl border p-4 shadow-xl" />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="skeleton h-12 w-96 max-w-full rounded-xl" />
            <div className="skeleton h-5 w-[32rem] max-w-full rounded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E7DDCA] bg-[#F8F2E8] px-4 py-16 dark:border-[#20362d] dark:bg-[#0b1512] sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3">
            <div className="skeleton h-4 w-44 rounded" />
            <div className="skeleton h-12 w-[34rem] max-w-full rounded-xl" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton-card overflow-hidden rounded-2xl border">
                <div className="skeleton h-52" />
                <div className="space-y-3 p-4">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
