'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const FAQS = [
  {
    section: 'Getting started',
    icon: '🌍',
    items: [
      {
        q: 'What is Markeetee?',
        a: 'Markeetee is a discovery platform that helps people find African-owned restaurants, grocery stores, fashion shops, beauty salons, wellness brands, services, and more in one place.',
      },
      {
        q: 'Who is Markeetee for?',
        a: 'Markeetee is for customers looking to discover African businesses and for business owners who want more visibility, reviews, and customer connections.',
      },
      {
        q: 'Is Markeetee free to use?',
        a: 'Yes. Customers can browse, search, view businesses, and use the map for free. A free account may be required for actions like saving businesses or leaving reviews.',
      },
      {
        q: 'Where is Markeetee available?',
        a: 'Markeetee is focused on African-owned businesses across the United States, with plans to grow into more cities and communities over time.',
      },
    ],
  },
  {
    section: 'Finding businesses',
    icon: '🔍',
    items: [
      {
        q: 'How do I find businesses near me?',
        a: 'Use the search bar, category filters, or map view to find businesses by city, category, country of origin, or keywords like jollof, braiding, Ankara, or African grocery.',
      },
      {
        q: 'Can I search by category?',
        a: 'Yes. You can browse categories such as Food & Groceries, Restaurants, Fashion & Fabric, Beauty & Hair, Herbs & Wellness, Music & Arts, Crafts & Decor, Services, and Bars & Nightlife.',
      },
      {
        q: 'Can I save a business?',
        a: 'Yes. Signed-in users can save businesses to their account and return to them later from their saved list.',
      },
      {
        q: 'How does the map work?',
        a: 'The map shows listed businesses based on their location. You can search by area, filter by category, and get directions to businesses near you.',
      },
    ],
  },
  {
    section: 'Reviews and trust',
    icon: '⭐',
    items: [
      {
        q: 'Can I leave a review?',
        a: 'Yes. Signed-in users can leave reviews for businesses they have visited or interacted with.',
      },
      {
        q: 'Can businesses delete bad reviews?',
        a: 'Businesses cannot simply remove reviews because they disagree with them. Reviews may be moderated if they violate Markeetee guidelines, contain spam, harassment, false information, or inappropriate content.',
      },
      {
        q: 'How do I report an incorrect listing or review?',
        a: 'Use the Contact page to report incorrect business details, suspicious reviews, or inappropriate content. Markeetee reviews reports and may update or remove content when necessary.',
      },
      {
        q: 'What does a verified business mean?',
        a: 'A verified business means Markeetee has taken steps to confirm that the listing is connected to a real business or authorized owner.',
      },
    ],
  },
  {
    section: 'For business owners',
    icon: '🏪',
    items: [
      {
        q: 'How do I list my business?',
        a: 'Click “List your business,” create an owner account, and enter your business details such as name, category, location, phone number, website, hours, and photos.',
      },
      {
        q: 'Can I claim an existing business listing?',
        a: 'Yes. If your business already appears on Markeetee, you can request to claim it. Markeetee may ask for verification before giving you owner access.',
      },
      {
        q: 'Can I add photos, products, or a menu?',
        a: 'Yes. Depending on your plan, you can upload a cover image, logo, gallery photos, products, services, or menu items from your business dashboard.',
      },
      {
        q: 'Can I update my business hours?',
        a: 'Yes. Business owners can update opening hours and days open from the dashboard under the listing section.',
      },
      {
        q: 'Can I manage multiple locations?',
        a: 'Multiple-location tools are available for higher-tier business plans such as Pro Store.',
      },
    ],
  },
  {
    section: 'Plans and pricing',
    icon: '💳',
    items: [
      {
        q: 'Is there a free plan?',
        a: 'Yes. The Starter plan is free and helps businesses get discovered with a basic listing, contact details, map visibility, and reviews.',
      },
      {
        q: 'What is included in the Growth plan?',
        a: 'Growth is designed for businesses that want more visibility. It includes features such as photo galleries, products or menu, analytics, featured search placement, and a verified badge.',
      },
      {
        q: 'What is included in the Pro Store plan?',
        a: 'Pro Store is designed for businesses that want a full digital storefront. It includes a custom store URL, multi-photo products, promotions, enquiry forms, product reviews, and advanced tools.',
      },
      {
        q: 'Can I change or cancel my plan?',
        a: 'Yes. Business owners can upgrade, downgrade, or cancel their subscription from the dashboard or by contacting Markeetee support.',
      },
    ],
  },
  {
    section: 'Account and security',
    icon: '🛡️',
    items: [
      {
        q: 'How do I sign in?',
        a: 'You can sign in using email and password. If enabled, you may also sign in using Google authentication.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Use the password reset option on the login page. You will receive an email with instructions to reset your password.',
      },
      {
        q: 'Is my information secure?',
        a: 'Markeetee uses secure authentication, encrypted connections, and trusted service providers to help protect user and business information.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact Markeetee support through the Contact page or email support to request account deletion.',
      },
    ],
  },
  {
    section: 'Support',
    icon: '📞',
    items: [
      {
        q: 'How do I contact Markeetee?',
        a: 'You can contact Markeetee through the Contact page for support, business questions, partnership requests, or reporting issues.',
      },
      {
        q: 'Can I suggest a new category or feature?',
        a: 'Yes. Markeetee welcomes feedback from customers and business owners as the platform grows.',
      },
      {
        q: 'Can I advertise or promote my business?',
        a: 'Promotional tools such as featured listings, special offers, and business announcements may be available depending on your business plan.',
      },
    ],
  },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const id = slugify(q)

  return (
    <div id={id} className="border-b border-gray-100 last:border-0 scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-green-700 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <ChevronDown
          size={17}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="pb-5">
          <p className="text-sm text-gray-600 leading-7">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [query, setQuery] = useState('')

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return FAQS

    return FAQS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          section.section.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0)
  }, [query])

  const popularQuestions = [
    'How do I list my business?',
    'Is there a free plan?',
    'How do I find businesses near me?',
    'Can I claim an existing business listing?',
  ]

  return (
    <div className="bg-[#F8FAF9] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div
            className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: '#E1F5EE', color: '#085041' }}
          >
            <HelpCircle size={26} />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Frequently asked questions
          </h1>

          <p className="text-gray-500 max-w-2xl mx-auto leading-7">
            Find answers about discovering African businesses, listing your
            business, reviews, pricing, accounts, and support.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <Search size={18} className="text-gray-400" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="flex-1 outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!query && (
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Popular questions
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {popularQuestions.map((question) => (
                <a
                  key={question}
                  href={`#${slugify(question)}`}
                  className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-green-300 hover:text-green-700 transition-colors"
                >
                  {question}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <h2 className="font-semibold text-gray-900 mb-2">
                No answers found
              </h2>
              <p className="text-sm text-gray-500">
                Try a different search term or contact us for help.
              </p>
            </div>
          ) : (
            filteredFaqs.map((section) => (
              <section key={section.section}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xl">{section.icon}</span>
                  <h2
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#1D9E75' }}
                  >
                    {section.section}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 px-5 shadow-sm">
                  {section.items.map((item) => (
                    <FAQItem key={item.q} {...item} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h3 className="font-semibold text-gray-900 mb-2">
              Need help as a customer?
            </h3>
            <p className="text-sm text-gray-500 mb-5 leading-7">
              Contact us if you need help finding businesses, saving favorites,
              leaving reviews, or reporting incorrect information.
            </p>
            <Link
              href="/contact"
              className="inline-block text-sm font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ background: '#1D9E75' }}
            >
              Contact support
            </Link>
          </div>

          <div
            className="rounded-2xl p-8 text-white"
            style={{ background: '#085041' }}
          >
            <h3 className="font-semibold mb-2">
              Are you a business owner?
            </h3>
            <p className="text-sm mb-5 leading-7" style={{ color: '#C5EADB' }}>
              Create a listing, claim your business, add photos, show products,
              and reach more customers through Markeetee.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl bg-white"
              style={{ color: '#085041' }}
            >
              List your business
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}