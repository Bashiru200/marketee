'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, Star, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface SavedBusiness {
  id: string
  business_id: string
  businesses: {
    id: string; name: string; category: string | null
    city: string | null; state: string | null
    cover_image: string | null; rating: number
    review_count: number; price_range: string | null
    verified: boolean
  }
}

const GRADIENTS: Record<string,string> = {
  food:'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant:'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
}

export default function SavedPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [saved,   setSaved]   = useState<SavedBusiness[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    if (!user) return
    loadSaved()
  }, [authLoading, isLoggedIn, user])

  async function loadSaved() {
    const { data } = await supabase
      .from('saved_businesses')
      .select('id, business_id, businesses(id,name,category,city,state,cover_image,rating,review_count,price_range,verified)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    setSaved((data ?? []) as SavedBusiness[])
    setLoading(false)
  }

  async function handleRemove(id: string) {
    await supabase.from('saved_businesses').delete().eq('id', id)
    setSaved(s => s.filter(x => x.id !== id))
  }

  if (authLoading || loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-6 h-6 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
        <div className="h-7 w-48 bg-gray-200 rounded-lg" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="h-36 bg-gray-200" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-3 w-1/2 bg-gray-200 rounded" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-8 w-full bg-gray-200 rounded-lg mt-2" style={{ animation: 'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
    </div>
    )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={22} style={{ color:'#1D9E75' }} />
        <h1 className="text-2xl font-bold text-gray-900">Saved businesses</h1>
        <span className="text-sm text-gray-400 ml-1">({saved.length})</span>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={40} className="mx-auto mb-4 text-gray-200" />
          <h2 className="font-semibold text-gray-700 mb-2">No saved businesses yet</h2>
          <p className="text-sm text-gray-400 mb-6">Tap the heart icon on any listing to save it here</p>
          <Link href="/search" className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ background:'#1D9E75' }}>
            Explore businesses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map(s => {
            const b = s.businesses
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-green-300 transition-colors group">
                <div className="relative h-36">
                  {b.cover_image
                    ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: GRADIENTS[b.category ?? ''] ?? GRADIENTS.services }} />
                  }
                  <button onClick={() => handleRemove(s.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-white transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="p-4">
                  <Link href={`/businesses/${b.id}`}>
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1">{b.name}</p>
                  </Link>
                  <div className="flex items-center gap-1 mt-1 mb-2">
                    <Star size={11} className="text-amber-400 fill-current" />
                    <span className="text-xs text-gray-700">{b.rating > 0 ? b.rating.toFixed(1) : '—'}</span>
                    <span className="text-xs text-gray-400">({b.review_count})</span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} style={{ color:'#1D9E75' }} />
                    {[b.city, b.state].filter(Boolean).join(', ')}
                  </p>
                  <Link href={`/businesses/${b.id}`}
                    className="mt-3 block text-center text-xs font-semibold text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ background:'#1D9E75' }}>
                    View Store
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}