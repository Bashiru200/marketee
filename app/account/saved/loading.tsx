export default function Loading() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-6 bg-gray-100 rounded skeleton" />
                <div className="h-7 w-48 bg-gray-100 rounded-lg skeleton" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="h-36 bg-gray-100 skeleton" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-100 rounded skeleton" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded skeleton" />
                      <div className="h-3 w-1/3 bg-gray-100 rounded skeleton" />
                      <div className="h-8 w-full bg-gray-100 rounded-lg skeleton mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}