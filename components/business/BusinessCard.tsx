import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, BadgeCheck } from 'lucide-react'
import SaveButton from '@/components/ui/SaveButton'

const FLAGS: Record<string, string> = {
  Nigeria:'🇳🇬', Ghana:'🇬🇭', Kenya:'🇰🇪',
  Senegal:'🇸🇳', 'South Africa':'🇿🇦', Ethiopia:'🇪🇹',
}

const GRADIENTS: Record<string, string> = {
  food:       'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion:    'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty:     'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs:      'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music:      'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts:     'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services:   'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
  nightlife: 'linear-gradient(135deg,#2D1B69,#6B46C1)',
}

interface Business {
  id: string
  name: string
  category?: string | null
  subcategory?: string | null
  cover_image?: string | null
  rating: number
  review_count: number
  address?: string | null
  city?: string | null
  state?: string | null
  price_range?: string | null
  tags?: string[] | null
  verified: boolean
  premium: boolean
  featured: boolean
  lat?: number | null
  lng?: number | null
  country?: string | null
  hours_open?: string | null
  days_open?:  string[] | null
}

import HoursBadge from '@/components/ui/HoursBadge'

export default function BusinessCard({ business: b }: { business: Business }) {
  const grad = GRADIENTS[b.category ?? ''] || GRADIENTS.services

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-300 hover:shadow-md transition-all group">
      <div className="relative" style={{ height: '180px' }}>
        {b.cover_image
          ? <Image
              src={b.cover_image}
              alt={b.name}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              className="object-cover"
              priority={false}
            />
          : <div className="w-full h-full" style={{ background: grad }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {b.featured && <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Featured</span>}
          {b.premium  && <span className="text-white text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1D9E75' }}>Premium</span>}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <SaveButton businessId={b.id} size="sm" />
          <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-sm">
            {FLAGS[b.country ?? ''] || '🌍'}
          </div>
        </div>
        {b.price_range && (
          <div className="absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white">
            {b.price_range}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1">
          <Link href={`/businesses/${b.id}`}
            className="font-bold text-gray-900 hover:text-green-700 transition-colors line-clamp-1">
            {b.name}
          </Link>
          {b.verified && <BadgeCheck size={15} style={{ color: '#1D9E75' }} className="flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mb-2">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11} className={i <= Math.round(b.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'} />
          ))}
          <span className="text-xs font-semibold text-gray-700">{b.rating?.toFixed(1) || '—'}</span>
          <span className="text-xs text-gray-400">({b.review_count})</span>
        </div>
        {b.address && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin size={11} style={{ color: '#1D9E75' }} />
            <span>{b.address}, {b.city}</span>
          </div>
        )}
        {b.tags && b.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {b.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E1F5EE', color: '#085041' }}>{t}</span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Link href={`/businesses/${b.id}`}
            className="flex-1 text-center text-sm font-medium text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: '#1D9E75' }}>
            View Store
          </Link>
          {b.lat && b.lng && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors">
              <MapPin size={13} /> Map
            </a>
          )}
        </div>
      </div>
    </div>
  )
}