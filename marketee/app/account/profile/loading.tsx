export default function Loading() {
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-8">
                <div className="h-7 w-28 bg-gray-100 rounded-lg skeleton" />
                <div className="h-5 w-20 bg-gray-100 rounded skeleton" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                <div className="h-24 skeleton" style={{ background:'linear-gradient(135deg,#085041,#1D9E75)', opacity:0.3 }} />
                <div className="px-6 pb-6">
                  <div className="flex items-end justify-between -mt-10 mb-5">
                    <div className="w-20 h-20 rounded-full bg-gray-100 skeleton border-4 border-white" />
                    <div className="h-9 w-28 bg-gray-100 rounded-xl skeleton" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-40 bg-gray-100 rounded skeleton" />
                    <div className="h-4 w-52 bg-gray-100 rounded skeleton" />
                    <div className="h-6 w-20 bg-gray-100 rounded-full skeleton mt-1" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                    <div className="w-5 h-5 bg-gray-100 rounded mx-auto mb-2 skeleton" />
                    <div className="h-6 w-10 bg-gray-100 rounded mx-auto mb-1 skeleton" />
                    <div className="h-3 w-14 bg-gray-100 rounded mx-auto skeleton" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="h-3 w-24 bg-gray-100 rounded skeleton" />
                </div>
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg skeleton flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-36 bg-gray-100 rounded skeleton" />
                      <div className="h-3 w-52 bg-gray-100 rounded skeleton" />
                    </div>
                    <div className="w-4 h-4 bg-gray-100 rounded skeleton" />
                  </div>
                ))}
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}