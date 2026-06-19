'use client'

import Image from 'next/image'

interface AfricaShapeProps {
  className?: string
  style?: React.CSSProperties
}

// Africa continent silhouette as inline SVG path
function AfricaShape({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
     <Image
      src="/Cartography_of_Africa.png"
      alt="Africa continent"
      width={200}
      height={240}
      className={className}
      style={style}
      priority
    />
  )
}

export default function CountriesBar() {
  return (
    <section className="py-14 overflow-hidden" >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col items-center text-center gap-6">

          {/* Africa shape — large, centred, glowing */}
          <div className="relative">
            {/* Soft glow behind the continent */}
            <div
              className="absolute inset-0 blur-2xl rounded-full scale-125"
              style={{ background: 'radial-gradient(circle, #9FE1CB55 0%, transparent 70%)' }}
            />
            <AfricaShape
              className="relative w-24 h-28 drop-shadow-sm"
              style={{ color: '#1D9E75' } as React.CSSProperties}
            />
          </div>

          {/* Catchy phrase */}
          <div>
            <p
              className="text-2xl sm:text-3xl font-bold leading-snug"
              style={{ color: '#427869' }}
            >
              Born from Africa.
              <br />
              <span style={{ color: '#1D9E75' }}>Built for the diaspora.</span>
            </p>
            <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
              Connecting African-owned businesses across the US with the community
              that loves them most — wherever home is from.
            </p>
          </div>

          {/* Subtle continent label strip */}
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gray-200" />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#548877' }}>
              54 countries. One community.
            </p>
            <div className="h-px w-12 bg-gray-200" />
          </div>

        </div>
      </div>
    </section>
  )
}
