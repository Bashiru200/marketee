'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, MessageSquare, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface MyReview {
  id: string; rating: number; title: string | null; body: string | null
  created_at: string
  businesses: { id: string; name: string; cover_image: string | null } | null
}

export default function MyReviewsPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { user, isLoggedIn, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) { router.replace('/auth/login'); return }
    supabase.from('reviews')
      .select('id, rating, title, body, created_at, businesses(id,name,cover_image)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .then((res: { data: MyReview[] | null }) => { setReviews((res.data ?? []) as MyReview[]); setLoading(false) })
  }, [authLoading, isLoggedIn])

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin" style={{ color:'#1D9E75' }} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare size={22} style={{ color:'#1D9E75' }} />
        <h1 className="text-2xl font-bold text-gray-900">My reviews</h1>
        <span className="text-sm text-gray-400 ml-1">({reviews.length})</span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={40} className="mx-auto mb-4 text-gray-200" />
          <h2 className="font-semibold text-gray-700 mb-2">No reviews yet</h2>
          <p className="text-sm text-gray-400 mb-6">Visit a business listing to leave your first review</p>
          <Link href="/search" className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ background:'#1D9E75' }}>
            Find businesses to review
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                {r.businesses?.cover_image ? (
                  <img src={r.businesses.cover_image} alt={r.businesses.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-xl" style={{ background:'#E1F5EE' }}>🏪</div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/businesses/${r.businesses?.id}`}
                    className="font-semibold text-sm text-gray-900 hover:text-green-700 transition-colors">
                    {r.businesses?.name ?? 'Unknown business'}
                  </Link>
                  <div className="flex items-center gap-1 my-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className={i <= r.rating ? 'text-amber-400 fill-current' : 'text-gray-200'} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </span>
                  </div>
                  {r.title && <p className="text-sm font-medium text-gray-800 mb-1">{r.title}</p>}
                  <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}