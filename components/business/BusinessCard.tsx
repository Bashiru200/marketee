import { AFRICAN_FLAGS } from '@/lib/africanCountries'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, BadgeCheck } from 'lucide-react'
import SaveButton from '@/components/ui/SaveButton'
import HoursBadge from '@/components/ui/HoursBadge'

const GRADIENTS: Record<string, string> = {
  food: 'linear-gradient(135deg,#c5eadb,#9fdcc3)',
  restaurant: 'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  fashion: 'linear-gradient(135deg,#FAEEDA,#FAC775)',
  beauty: 'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  herbs: 'linear-gradient(135deg,#EAF3DE,#C0DD97)',
  music: 'linear-gradient(135deg,#FAECE7,#F0997B)',
  crafts: 'linear-gradient(135deg,#E6F1FB,#85B7EB)',
  services: 'linear-gradient(135deg,#F1EFE8,#B4B2A9)',
  nightlife: 'linear-gradient(135deg,#2D1B69,#6B46C1)',
}

export default function BusinessCard({ business: b }: any) {
  const grad = GRADIENTS[b.category ?? ''] || GRADIENTS.services

  return (
    <div className="
      group
      bg-white
      rounded-2xl
      overflow-hidden
      border border-gray-100
      hover:border-[#1D9E75]/30
      hover:shadow-lg
      transition-all
    ">

      {/* IMAGE */}
      <div className="relative h-[200px] overflow-hidden">

        {b.cover_image ? (
          <Image
            src={b.cover_image}
            alt={b.name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition duration-700"
          />
        ) : (
          <div className="w-full h-full" style={{ background: grad }} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {b.featured && (
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
              Featured
            </span>
          )}
          {b.premium && (
            <span className="bg-[#1D9E75] text-white text-xs px-2 py-1 rounded-full">
              Premium
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <SaveButton businessId={b.id} size="sm" />

          <div className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-sm">
            {AFRICAN_FLAGS[b.country ?? ''] || '🌍'}
          </div>
        </div>

        {/* Bottom content (on image) */}
        <div className="absolute bottom-4 left-4 right-4 text-white">

          <div className="flex items-center gap-1">
            <Link
              href={`/businesses/${b.id}`}
              className="font-semibold text-lg leading-tight"
            >
              {b.name}
            </Link>

            {b.verified && (
              <BadgeCheck size={16} className="text-[#1D9E75]" />
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Star size={13} className="text-amber-400 fill-current" />
            {b.rating?.toFixed(1) || '—'}
            <span className="text-white/70 text-xs">
              ({b.review_count})
            </span>
          </div>

        </div>

      </div>

      {/* CONTENT */}
      <div className="p-4">

        {/* Address */}
        {b.address && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <MapPin size={12} className="text-[#1D9E75]" />
            <span className="line-clamp-1">
              {b.address}, {b.city}
            </span>
          </div>
        )}

        {/* Hours */}
        {b.hours_open && (
          <div className="mb-3">
            <HoursBadge
              hoursOpen={b.hours_open}
              daysOpen={b.days_open}
            />
          </div>
        )}

        {/* Tags */}
        {b.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {b.tags.slice(0, 3).map((t: string) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-full bg-[#E1F5EE] text-[#085041]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-2">

          <Link
            href={`/businesses/${b.id}`}
            className="
              flex-1
              text-center
              text-sm
              font-semibold
              text-white
              py-2
              rounded-xl
              bg-[#1D9E75]
              hover:opacity-90
            "
          >
            View Store
          </Link>

          {b.lat && b.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                px-3
                flex items-center gap-1
                text-sm
                border
                rounded-xl
                hover:border-[#1D9E75]
                hover:text-[#1D9E75]
              "
            >
              <MapPin size={13} />
            </a>
          )}

        </div>

      </div>

    </div>
  )
}