'use client'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Category images — two options:
 *
 * Option A (recommended for production):
 *   Upload your own photos to /public/categories/ and reference them as:
 *   image: '/categories/food.jpg'
 *
 * Option B (used here for launch — free Unsplash photos, no upload needed):
 *   Unsplash source URLs resize automatically. Replace any with your own
 *   photos once you have them.
 *
 * Ideal image size: 600×600px, compressed JPG.
 */
const CATEGORIES = [
  {
    id:    'food',
    name:  'Food & Groceries',
    icon:  '🍲',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
    // African market stall with produce — replace with your own photo
    overlay: 'rgba(5,53,40,0.45)',
  },
  {
    id:    'restaurant',
    name:  'Restaurants',
    icon:  '🍽️',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    overlay: 'rgba(29,12,80,0.45)',
  },
  {
    id:    'fashion',
    name:  'Fashion & Fabric',
    icon:  '👗',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&q=80',
    // African print fabric — replace with Ankara/Kente photo
    overlay: 'rgba(90,50,0,0.4)',
  },
  {
    id:    'beauty',
    name:  'Beauty & Hair',
    icon:  '💆',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    overlay: 'rgba(80,10,40,0.4)',
  },
  {
    id:    'herbs',
    name:  'Herbs & Wellness',
    icon:  '🌿',
    image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=600&q=80',
    overlay: 'rgba(20,60,0,0.4)',
  },
  {
    id:    'music',
    name:  'Music & Arts',
    icon:  '🎵',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    overlay: 'rgba(80,30,0,0.45)',
  },
  {
    id:    'crafts',
    name:  'Crafts & Decor',
    icon:  '🏺',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    overlay: 'rgba(10,30,70,0.4)',
  },
  {
    id:    'services',
    name:  'Services',
    icon:  '🛠️',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
    overlay: 'rgba(30,30,30,0.45)',
  },
  {
    id:    'nightlife',
    name:  'Bars & Nightlife',
    icon:  '🍺',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80',
    overlay: 'rgba(15,5,50,0.55)',
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
          {/* Background photo */}
          <Image
            src={cat.image}
            alt={cat.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Dark overlay for text legibility */}
          <div
            className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
            style={{ background: cat.overlay }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <span
              className="text-3xl group-hover:scale-110 transition-transform duration-300"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
            >
              {cat.icon}
            </span>
            <span className="text-xs font-bold text-white leading-tight drop-shadow-md">
              {cat.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}