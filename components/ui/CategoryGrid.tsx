'use client'

import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = [
  { id:'food', name:'Food & Groceries', icon:'🍲', image:'/images/categories/food.jpeg' },
  { id:'restaurants', name:'Restaurants', icon:'🍽️', image:'/images/categories/restaurants.jpeg' },
  { id:'fashion', name:'Fashion & Fabric', icon:'👗', image:'/images/categories/fashion.jpeg' },
  { id:'beauty', name:'Beauty & Hair', icon:'💇', image:'/images/categories/beauty.jpeg' },
  { id:'wellness', name:'Herbs & Wellness', icon:'🌿', image:'/images/categories/wellness.jpeg' },
  { id:'music', name:'Music & Arts', icon:'🎶', image:'/images/categories/music.jpeg' },
  { id:'crafts', name:'Crafts & Decor', icon:'🏺', image:'/images/categories/crafts.jpeg' },
  { id:'services', name:'Services', icon:'🛠️', image:'/images/categories/services.jpeg' },
]

export default function CategoryGrid() {

  return (
    <section className="py-8">

      <div
        className="
          flex gap-4
          overflow-x-auto
          px-4
          pb-2
          snap-x snap-mandatory
          scroll-smooth
        "
      >

        {CATEGORIES.map((cat) => (

          <Link
            key={cat.id}
            href={`/search?category=${cat.id}`}
            className="
              relative
              min-w-[160px]
              h-[200px]
              rounded-2xl
              overflow-hidden
              flex-shrink-0
              snap-start
              group
              shadow-sm
              hover:shadow-lg
              transition-all
            "
          >

            {/* Image */}
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="
                (max-width: 640px) 45vw,
                (max-width: 1024px) 25vw,
                160px
              "
              className="
                object-cover
                group-hover:scale-110
                transition-transform
                duration-700
              "
              priority={cat.id === 'food'} // preload first image
            />

            {/* Gradient */}
            <div className="
              absolute inset-0
              bg-gradient-to-t
              from-black/70
              via-black/20
              to-transparent
            " />

            {/* Content */}
            <div className="
              absolute bottom-4 left-4 right-4
              text-white
            ">

              <div className="text-2xl mb-1">
                {cat.icon}
              </div>

              <p className="text-sm font-semibold leading-tight">
                {cat.name}
              </p>

            </div>

          </Link>

        ))}

      </div>

    </section>
  )
}