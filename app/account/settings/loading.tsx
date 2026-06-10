export default function Loading() {
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-6 bg-gray-100 rounded skeleton" />
                <div className="h-7 w-28 bg-gray-100 rounded-lg skeleton" />
              </div>
              <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="h-3 w-24 bg-gray-100 rounded skeleton" />
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[1,2].map(j => (
                        <div key={j} className="flex items-center justify-between px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg skeleton" />
                            <div className="space-y-1.5">
                              <div className="h-4 w-32 bg-gray-100 rounded skeleton" />
                              <div className="h-3 w-48 bg-gray-100 rounded skeleton" />
                            </div>
                          </div>
                          <div className="h-6 w-11 bg-gray-100 rounded-full skeleton" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}