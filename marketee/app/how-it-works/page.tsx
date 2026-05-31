import Link from 'next/link'

export const metadata = { title: 'How Markeetee Works' }

const customerSteps = [
  { num:'01', icon:'🔍', title:'Search', body:'Type what you\'re looking for — jollof rice, ankara fabric, hair braiding — and your city or zip code.' },
  { num:'02', icon:'🗺️', title:'Discover on the map', body:'See every matching business pinned on a live Google Map. Click any pin to see photos, hours, and contact info.' },
  { num:'03', icon:'⭐', title:'Read real reviews', body:'Browse verified reviews from fellow diaspora community members who have actually visited or ordered from the business.' },
  { num:'04', icon:'📍', title:'Get directions', body:'Tap Get Directions to open Google Maps with turn-by-turn navigation straight to the business.' },
]

const ownerSteps = [
  { num:'01', icon:'📝', title:'Create a free listing', body:'Sign up as a business owner and fill in your business name, category, location, and contact details. Takes 3 minutes.' },
  { num:'02', icon:'📸', title:'Add photos & products', body:'Upload a cover photo, logo, and product images from your dashboard. Visual listings get 3x more views.' },
  { num:'03', icon:'🕐', title:'Set your hours', body:'Add your opening hours and days so customers know exactly when to visit or call.' },
  { num:'04', icon:'🚀', title:'Get discovered', body:'Your business appears in search results, on the map, and in category browsing — reaching thousands of diaspora customers.' },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">How Markeetee works</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Whether you're looking for authentic African businesses or ready to list your own, Markeetee makes it simple.</p>
      </div>

      {/* For customers */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background:'#1D9E75' }}>👤</div>
          <h2 className="text-xl font-bold text-gray-900">For customers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerSteps.map(s => (
            <div key={s.num} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="text-xs font-bold mb-1" style={{ color:'#1D9E75' }}>Step {s.num}</p>
              <p className="font-semibold text-gray-900 mb-2">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/search" className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl" style={{ background:'#1D9E75' }}>
            Start exploring →
          </Link>
        </div>
      </div>

      {/* For owners */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background:'#085041' }}>🏪</div>
          <h2 className="text-xl font-bold text-gray-900">For business owners</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ownerSteps.map(s => (
            <div key={s.num} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="text-xs font-bold mb-1" style={{ color:'#085041' }}>Step {s.num}</p>
              <p className="font-semibold text-gray-900 mb-2">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/auth/signup" className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl" style={{ background:'#085041' }}>
            List your business free →
          </Link>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-2xl p-8 text-center" style={{ background:'#f0faf6' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Free to list. Upgrade when you're ready to grow</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[['Free','$0/mo','Basic listing, map pin, contact info'],['Premium','$29/mo','Photos, featured placement, products'],['Storefront','$49/mo','Online enquiry, WhatsApp, custom URL']].map(([name,price,desc]) => (
            <div key={name} className="bg-white rounded-xl border border-gray-100 p-5 text-left min-w-48">
              <p className="font-bold text-gray-900">{name}</p>
              <p className="text-lg font-bold my-1" style={{ color:'#1D9E75' }}>{price}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}