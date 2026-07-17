// components/dashboard/VisibilityScore.tsx
'use client'
import { useMemo } from 'react'
import { Eye, TrendingUp, AlertCircle } from 'lucide-react'

interface Business {
  name:        string
  cover_image: string | null
  logo_url:    string | null
  description: string | null
  phone:       string | null
  email:       string | null
  website:     string | null
  hours_open:  string | null
  days_open:   string[] | null
  street:      string | null
  address:     string | null
  city:        string | null
  state:       string | null
  country:     string | null
  plan:        string | null
  verified:    boolean
}

interface Review  { id: string }
interface Product { id: string }

interface Props {
  biz:      Business
  reviews:  Review[]
  products: Product[]
  onFix:    () => void
}

const SCORE_ITEMS = [
  { key: 'cover',       label: 'Cover photo',          points: 20, tip: 'Add a cover photo — businesses with photos get 3x more views'     },
  { key: 'description', label: 'Business description', points: 15, tip: 'Write a description of at least 100 characters'                    },
  { key: 'hours',       label: 'Opening hours',        points: 15, tip: 'Set your hours so customers know when to visit'                    },
  { key: 'address',     label: 'Full address',         points: 15, tip: 'A complete address helps customers find you on the map'            },
  { key: 'phone',       label: 'Phone number',         points: 10, tip: 'Add your phone so customers can call or WhatsApp you'             },
  { key: 'products',    label: '3+ products listed',   points: 10, tip: 'Add at least 3 products — listings with products get more enquiries'},
  { key: 'reviews',     label: '5+ customer reviews',  points: 10, tip: 'Share your link with happy customers to build trust'              },
  { key: 'verified',    label: 'Verified badge',       points: 5,  tip: 'Claim and verify your business to get the verified badge'         },
]

export default function VisibilityScore({ biz, reviews, products, onFix }: Props) {
  const scores = useMemo(() => ({
    cover:       !!biz.cover_image,
    description: !!(biz.description && biz.description.length > 100),
    hours:       !!(biz.hours_open && biz.days_open && biz.days_open.length > 0),
    address:     !!(biz.street ?? biz.address) && !!biz.city && !!biz.state,
    phone:       !!biz.phone,
    products:    products.length >= 3,
    reviews:     reviews.length >= 5,
    verified:    !!biz.verified,
  }), [biz, reviews, products])

  const total = SCORE_ITEMS.reduce((sum, item) => sum + (scores[item.key as keyof typeof scores] ? item.points : 0), 0)
  const max   = SCORE_ITEMS.reduce((sum, item) => sum + item.points, 0)
  const pct   = Math.round((total / max) * 100)

  const color = pct >= 80 ? '#1D9E75' : pct >= 50 ? '#D97706' : '#EF4444'
  const label = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs work'

  const missing = SCORE_ITEMS.filter(item => !scores[item.key as keyof typeof scores])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#E1F5EE' }}>
            <Eye size={18} style={{ color: '#1D9E75' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-gray-900">Visibility Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color }}>{pct}</span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        </div>

        {/* Score breakdown ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={color} strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black" style={{ color }}>{pct}</span>
              <span className="text-[9px] text-gray-400 font-medium">{label}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {pct >= 80
                ? '🎉 Your profile is highly visible!'
                : pct >= 60
                ? '👍 Good start — a few more improvements needed'
                : '⚠️ Your profile needs more info to rank well'}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A higher score means more customers find you in search and on the map.
            </p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Score breakdown
        </p>
        <div className="space-y-2">
          {SCORE_ITEMS.map(item => {
            const done = scores[item.key as keyof typeof scores]
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                  style={{ background: done ? '#E1F5EE' : '#F3F4F6' }}>
                  {done ? '✓' : '·'}
                </div>
                <p className={`flex-1 text-sm ${done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {item.label}
                </p>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: done ? '#1D9E75' : '#9CA3AF' }}>
                  +{item.points}
                </span>
              </div>
            )
          })}
        </div>

        {/* Missing items with fix tips */}
        {missing.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Quick wins ({missing.length} remaining)
            </p>
            {missing.slice(0, 3).map(item => (
              <div key={item.key} className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: '#FFFBEB' }}>
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                <p className="text-xs text-amber-800 leading-relaxed">{item.tip}</p>
              </div>
            ))}
            <button onClick={onFix}
              className="w-full mt-2 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: '#1D9E75' }}>
              Improve my score →
            </button>
          </div>
        )}

        {missing.length === 0 && (
          <div className="mt-4 p-3 rounded-xl flex items-center gap-2"
            style={{ background: '#E1F5EE' }}>
            <TrendingUp size={14} style={{ color: '#1D9E75' }} />
            <p className="text-xs font-semibold" style={{ color: '#085041' }}>
              Perfect score! Your listing is fully optimised.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}