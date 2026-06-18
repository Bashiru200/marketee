'use client'
import Link from 'next/link'

const CATEGORIES = [
  {
    id:      'food',
    name:    'Food & Groceries',
    icon:    '🍲',
    bg:      'linear-gradient(135deg, #c5eadb 0%, #9fdcc3 100%)',
    pattern: '🍲🌽🥘🫘🍚🥜',
    text:    '#053528',
  },
  {
    id:      'restaurant',
    name:    'Restaurants',
    icon:    '🍽️',
    bg:      'linear-gradient(135deg, #EEEDFE 0%, #AFA9EC 100%)',
    pattern: '🍽️🥗🍖🫕🍱🥩',
    text:    '#2D2580',
  },
  {
    id:      'fashion',
    name:    'Fashion & Fabric',
    icon:    '👗',
    bg:      'linear-gradient(135deg, #FAEEDA 0%, #FAC775 100%)',
    pattern: '👗🧵🪡👘🧶👔',
    text:    '#7A4A00',
  },
  {
    id:      'beauty',
    name:    'Beauty & Hair',
    icon:    '💆',
    bg:      'linear-gradient(135deg, #FBEAF0 0%, #ED93B1 100%)',
    pattern: '💆💅💄🪮✂️💋',
    text:    '#7A1040',
  },
  {
    id:      'herbs',
    name:    'Herbs & Wellness',
    icon:    '🌿',
    bg:      'linear-gradient(135deg, #EAF3DE 0%, #C0DD97 100%)',
    pattern: '🌿🌱🍃🪴🌾🌻',
    text:    '#2D5A00',
  },
  {
    id:      'music',
    name:    'Music & Arts',
    icon:    '🎵',
    bg:      'linear-gradient(135deg, #FAECE7 0%, #F0997B 100%)',
    pattern: '🎵🥁🎸🎺🎨🎭',
    text:    '#7A2A00',
  },
  {
    id:      'crafts',
    name:    'Crafts & Decor',
    icon:    '🏺',
    bg:      'linear-gradient(135deg, #E6F1FB 0%, #85B7EB 100%)',
    pattern: '🏺🪆🧸🎋🪑🖼️',
    text:    '#1A3D6B',
  },
  {
    id:      'services',
    name:    'Services',
    icon:    '🛠️',
    bg:      'linear-gradient(135deg, #F1EFE8 0%, #B4B2A9 100%)',
    pattern: '🛠️🔧⚙️🪛🔨🪚',
    text:    '#3D3B35',
  },
  {
    id:      'nightlife',
    name:    'Bars & Nightlife',
    icon:    '🍺',
    bg:      'linear-gradient(135deg, #2D1B69 0%, #6B46C1 100%)',
    pattern: '🍺🍸🎶🪩🎤🥂',
    text:    '#E9D5FF',
  },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CATEGORIES.map(cat => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.id}`}
          className="group relative overflow-hidden rounded-2xl"
          style={{ aspectRatio: '1 / 1' }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{ background: cat.bg }}
          />

          {/* Floating emoji pattern background */}
          <div
            className="absolute inset-0 flex flex-wrap content-start gap-1 p-2 opacity-20 group-hover:opacity-30 transition-opacity duration-500 overflow-hidden select-none pointer-events-none"
            style={{ fontSize: '22px', lineHeight: '1.4' }}
            aria-hidden
          >
            {(() => {
              // Array.from correctly splits multi-byte emoji characters
              // (unlike .split('') which breaks surrogate pairs and causes
              // server/client hydration mismatches)
              const emojis = Array.from(cat.pattern).filter(c => c.trim())
              return Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    animation:        `float${i % 3} ${3 + (i % 3)}s ease-in-out infinite`,
                    animationDelay:   `${(i * 0.3) % 2}s`,
                    transform:        `rotate(${(i * 15) % 30 - 15}deg)`,
                  }}
                >
                  {emojis[i % emojis.length]}
                </span>
              ))
            })()}
          </div>

          {/* Content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
          >
            <span
              className="text-4xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            >
              {cat.icon}
            </span>
            <span
              className="text-xs font-bold leading-tight"
              style={{ color: cat.text }}
            >
              {cat.name}
            </span>
          </div>

          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.08)' }}
          />
        </Link>
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float0 {
          0%, 100% { transform: translateY(0px) rotate(-10deg); }
          50%       { transform: translateY(-6px) rotate(10deg); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(5deg); }
          50%       { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-4px) rotate(15deg); }
        }
      `}} />
    </div>
  )
}