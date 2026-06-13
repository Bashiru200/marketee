'use client'

const COUNTRIES = [
  { flag:'🇳🇬', name:'Nigeria',       city:'Lagos'     },
  { flag:'🇬🇭', name:'Ghana',         city:'Accra'     },
  { flag:'🇰🇪', name:'Kenya',         city:'Nairobi'   },
  { flag:'🇸🇳', name:'Senegal',       city:'Dakar'     },
  { flag:'🇿🇦', name:'South Africa',  city:'Cape Town' },
  { flag:'🇪🇹', name:'Ethiopia',      city:'Addis Ababa'},
  { flag:'🇨🇲', name:'Cameroon',      city:'Yaoundé'   },
  { flag:'🇨🇮', name:"Côte d'Ivoire", city:'Abidjan'   },
]

// Africa continent silhouette as inline SVG path
function AfricaShape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M100 6 C92 6 82 10 74 18 C64 28 60 42 58 54
           C54 62 46 66 42 74 C36 84 34 98 36 112
           C38 124 44 134 46 146 C48 158 44 170 46 182
           C48 194 56 206 68 216 C78 224 90 230 100 234
           C110 230 122 224 132 216 C144 206 152 194 154 182
           C156 170 152 158 154 146 C156 134 162 124 164 112
           C166 98 164 84 158 74 C154 66 146 62 142 54
           C140 42 136 28 126 18 C118 10 108 6 100 6 Z"
        fill="currentColor"
      />
      {/* Madagascar */}
      <ellipse cx="168" cy="168" rx="8" ry="18" fill="currentColor" opacity="0.6" transform="rotate(-15 168 168)"/>
    </svg>
  )
}

export default function CountriesBar() {
  return (
    <section className="bg-white border-b border-gray-100 py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8">

          {/* Africa shape + headline */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <AfricaShape className="w-14 h-16 text-green-700 opacity-80" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                Serving the diaspora from
              </p>
              <p className="text-lg font-bold text-gray-900">Across Africa</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-12 bg-gray-200" />

          {/* Country pills */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 flex-1">
            {COUNTRIES.map(({ flag, name, city }) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50 hover:border-green-200 hover:bg-green-50 transition-colors cursor-default"
              >
                <span className="text-lg">{flag}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-none">{name}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">{city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}