export default function Loading() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 skeleton" />
                  <div className="space-y-2">
                    <div className="h-6 w-40 bg-gray-100 rounded-lg skeleton" />
                    <div className="h-3 w-56 bg-gray-100 rounded skeleton" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="w-5 h-5 bg-gray-100 rounded mb-3 skeleton" />
                    <div className="h-8 w-16 bg-gray-100 rounded mb-2 skeleton" />
                    <div className="h-3 w-24 bg-gray-100 rounded skeleton" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-3">
                  <div className="flex-1 h-10 bg-gray-100 rounded-xl skeleton" />
                  <div className="h-10 w-48 bg-gray-100 rounded-xl skeleton" />
                </div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 skeleton flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-gray-100 rounded skeleton" />
                      <div className="h-3 w-64 bg-gray-100 rounded skeleton" />
                    </div>
                    <div className="flex gap-1.5">
                      {[1,2,3,4].map(j => <div key={j} className="w-8 h-8 bg-gray-100 rounded-lg skeleton" />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}