// components/ui/RecentlyClaimedSection.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_ICON: Record<string, string> = {
  food: '🍲', restaurant: '🍽️', fashion: '👗',
  beauty: '💇', herbs: '🌿', music: '🎵',
  crafts: '🏺', services: '🛠️', nightlife: '🍸',
}

const CATEGORY_LABEL: Record<string, string> = {
  food: 'Food & Groceries', restaurant: 'Restaurant', fashion: 'Fashion & Fabric',
  beauty: 'Beauty & Hair', herbs: 'Herbs & Wellness', music: 'Music & Arts',
  crafts: 'Crafts & Decor', services: 'Services', nightlife: 'Bars & Nightlife',
}

export default async function RecentlyClaimedSection() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('businesses')
    .select('id, name, category, city, state, cover_image, verified, owner_id, created_at')
    .not('owner_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8)

  if (!data || data.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recently Joined</h2>
          <p className="text-sm text-gray-500 mt-1">Business owners who just set up their listing</p>
        </div>
        <Link href="/search"
          className="text-sm font-semibold hidden sm:block"
          style={{ color: '#1D9E75' }}>
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {data.map(b => (
          <Link key={b.id} href={`/businesses/${b.id}`}
            className="group flex flex-col items-center text-center gap-2">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform">
              {b.cover_image
                ? <img src={b.cover_image} alt={b.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg,#E1F5EE,#9FE1CB)' }}>
                    {CATEGORY_ICON[b.category ?? ''] ?? '🏪'}
                  </div>
              }
              {b.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <BadgeCheck size={13} style={{ color: '#1D9E75' }} />
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{b.name}</p>
            <p className="text-[10px] text-gray-400">{b.city}, {b.state}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}