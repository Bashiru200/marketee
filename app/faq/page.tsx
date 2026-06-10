'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

const FAQS = [
  {
    section: 'For customers',
    items: [
      { q: 'What is Markeetee?', a: 'Markeetee is the African business directory for the diaspora. We help you find African-owned grocery stores, restaurants, fashion shops, beauty salons, and more across the United States — with map directions and real community reviews.' },
      { q: 'Is Markeetee free to use?', a: 'Yes — browsing, searching, and leaving reviews is completely free for customers. You just need to create a free account to submit reviews.' },
      { q: 'How do I find businesses near me?', a: 'Use the search bar on the home page and type your city or zip code in the location field. You can also browse the map view to see all businesses pinned to their real location.' },
      { q: 'How do I save a business?', a: 'Click the heart icon on any business listing to save it to your account. Find all your saved businesses in your account under Saved businesses.' },
      { q: 'Can I trust the reviews?', a: 'Reviews can only be submitted by signed-in users, and each user can only review a business once. This prevents fake reviews and keeps the community trustworthy.' },
    ],
  },
  {
    section: 'For business owners',
    items: [
      { q: 'How do I list my business?', a: 'Click "List your business" and create a free owner account. You\'ll be guided through adding your business name, category, country of origin, location, and contact details. Your listing goes live immediately.' },
      { q: 'Is listing my business free?', a: 'Yes — the basic listing is completely free and includes your business name, category, address, phone, email, and a map pin. Premium features like photo galleries and featured placement are available from $29/month.' },
      { q: 'How do I add photos and products?', a: 'Log into your dashboard and go to the Listing tab to upload a cover photo and logo, or the Products tab to add individual products with images and prices.' },
      { q: 'What is the Premium plan?', a: 'Premium ($29/month) gives you photo galleries, featured placement in search results, product listings, and priority ranking. Storefront ($49/month) adds online enquiry, WhatsApp integration, and a custom store URL.' },
      { q: 'How do I update my business hours?', a: 'In your dashboard under the Listing tab, scroll to Opening Hours. Set your time range (e.g. 9am–9pm) and toggle the days you\'re open.' },
    ],
  },
  {
    section: 'General',
    items: [
      { q: 'Which cities is Markeetee available in?', a: 'We launched in Houston, TX and are actively expanding. Businesses from any US city can list — we\'re building toward coverage in Atlanta, Dallas, New York, and Washington DC next.' },
      { q: 'How do I report an incorrect listing?', a: 'Use the Contact page to report any listing that appears incorrect, misleading, or inappropriate. We review all reports within 24 hours.' },
      { q: 'Can I list a business that ships nationwide?', a: 'Yes — you can list any African-owned business regardless of whether it has a physical location. Online-only businesses can be listed with their city of operation.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-green-700 transition-colors">
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-600 leading-relaxed pb-4">{a}</p>}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Frequently asked questions</h1>
        <p className="text-gray-500">Everything you need to know about Markeetee.</p>
      </div>
      <div className="space-y-8">
        {FAQS.map(section => (
          <div key={section.section}>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ color:'#1D9E75' }}>{section.section}</h2>
            <div className="bg-white rounded-2xl border border-gray-100 px-5">
              {section.items.map(item => <FAQItem key={item.q} {...item} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center bg-white rounded-2xl border border-gray-100 p-8">
        <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-sm text-gray-400 mb-4">Our team is happy to help.</p>
        <Link href="/contact" className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ background:'#1D9E75' }}>
          Contact us
        </Link>
      </div>
    </div>
  )
}