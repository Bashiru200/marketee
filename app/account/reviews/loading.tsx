export default function Loading() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-6 bg-gray-100 rounded skeleton" />
                <div className="h-7 w-32 bg-gray-100 rounded-lg skeleton" />
              </div>
              <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-gray-100 rounded skeleton" />
                        <div className="h-3 w-24 bg-gray-100 rounded skeleton" />
                        <div className="h-3 w-full bg-gray-100 rounded skeleton" />
                        <div className="h-3 w-2/3 bg-gray-100 rounded skeleton" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}