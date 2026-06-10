export default function Loading() {
  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
              <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center gap-3">
                  <div className="flex-1 h-10 bg-gray-100 rounded-xl skeleton" />
                  <div className="w-36 h-10 bg-gray-100 rounded-xl skeleton" />
                  <div className="w-24 h-10 bg-gray-100 rounded-xl skeleton" />
                </div>
                <div className="max-w-7xl mx-auto flex gap-2 mt-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-7 w-24 bg-gray-100 rounded-full skeleton" />)}
                </div>
              </div>
              <div className="flex-1 flex">
                <div className="flex-1 skeleton" style={{ background:'linear-gradient(135deg,#f0faf6,#e8f7f1)', opacity:0.6 }} />
                <div className="hidden md:block w-72 bg-white border-l border-gray-100">
                  <div className="p-4 border-b border-gray-100">
                    <div className="h-4 w-32 bg-gray-100 rounded skeleton" />
                  </div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-3 p-4 border-b border-gray-50">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-100 rounded skeleton" />
                        <div className="h-3 w-24 bg-gray-100 rounded skeleton" />
                        <div className="h-3 w-16 bg-gray-100 rounded skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </>
  )
}