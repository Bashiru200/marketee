// app/launch/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import ListBusinessButton from '@/components/ui/ListBusinessButton'

export const metadata: Metadata = {
  title: 'Free Launch Access | Markeetee',
  description:
    'Join Markeetee during our launch and unlock every Pro Store feature for free. African-owned businesses across the US — list yours today.',
  openGraph: {
    title: 'Free Launch Access | Markeetee',
    description: 'Every growth feature, free during our launch period.',
    images: ['/og-default.png'],
  },
}

const FEATURES = [
  { icon: '📍', label: 'Business listing on map & search'      },
  { icon: '✅', label: 'Verified business badge'               },
  { icon: '🖼️', label: 'Unlimited photo gallery'               },
  { icon: '📦', label: 'Products & menu listing'               },
  { icon: '⭐', label: 'Featured search placement'             },
  { icon: '📊', label: 'Advanced analytics dashboard'          },
  { icon: '🔗', label: 'Custom store URL (markeetee.com/store/you)' },
  { icon: '💬', label: 'Product reviews from customers'        },
  { icon: '🏷️', label: 'Sale & promotion notifications'        },
  { icon: '📧', label: 'Online lead enquiry form'              },
  { icon: '📱', label: 'WhatsApp enquiry integration'          },
  { icon: '📍', label: 'Multiple branch locations'             },
]

const WHY = [
  {
    icon: '🏪',
    title: 'Build our marketplace',
    body:  'Great marketplaces start with great businesses. We want African-owned businesses established and thriving before our full public launch.',
  },
  {
    icon: '💬',
    title: 'Learn from you',
    body:  'Your feedback shapes every feature. Early businesses help us build the platform the diaspora actually needs.',
  },
  {
    icon: '🌍',
    title: 'Grow together',
    body:  'The first businesses on Markeetee become the foundation of our community and help shape where we go next.',
  },
]

const FLAGS = ['🇳🇬','🇬🇭','🇰🇪','🇸🇳','🇿🇦','🇪🇹','🇨🇲','🇨🇮','🇹🇿','🇺🇬','🇷🇼','🇲🇦']

export default function LaunchPage() {
  return (
    <main className="min-h-screen" style={{ background: '#F8FAF9' }}>
      <section className="max-w-6xl mx-auto px-4 py-20">

        {/* ── Hero ── */}
        <div className="text-center max-w-3xl mx-auto mb-20">

          <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-bold mb-6"
            style={{ background: '#E1F5EE', color: '#085041' }}>
            🚀 Limited Time — Launch Offer
          </span>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Every Pro Store Feature<br />
            <span style={{ color: '#1D9E75' }}>Free During Launch</span>
          </h1>

          <p className="text-lg leading-relaxed text-gray-600 max-w-2xl mx-auto mb-8">
            We're opening Markeetee to early African-owned businesses. As a thank-you
            for joining us first, every registered business gets complete Pro Store
            access — worth <strong>$49/month</strong> — at absolutely no cost during our
            launch period.
          </p>

          {/* Flag strip */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {FLAGS.map(f => (
              <span key={f} className="text-2xl">{f}</span>
            ))}
          </div>
          <p className="text-sm text-gray-400">54 African nations · One community</p>
        </div>

        {/* ── Pricing card ── */}
        <div className="max-w-lg mx-auto mb-24">
          <div className="rounded-3xl bg-white border border-green-200 shadow-xl overflow-hidden">

            {/* Card header */}
            <div className="p-8 text-center text-white"
              style={{ background: 'linear-gradient(135deg,#053528,#1D9E75)' }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image src="/apple-touch-icon.png" alt="Markeetee" width={36} height={36}
                  style={{ borderRadius: 9 }} />
                <span className="text-xl font-bold">Markeetee</span>
              </div>
              <p className="uppercase tracking-widest text-xs font-bold opacity-80 mb-2">
                Pro Store — Launch Access
              </p>
              <div className="flex items-end justify-center gap-2 mb-1">
                <span className="text-5xl font-black">$0</span>
                <span className="text-green-200 mb-1">/month during launch</span>
              </div>
              <p className="text-green-200 text-sm">
                Normally <span className="line-through">$49/month</span> · Full Pro Store access
              </p>
            </div>

            {/* Features list */}
            <div className="p-8">
              <ul className="space-y-3 mb-8">
                {FEATURES.map(({ icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <span className="text-gray-700 text-sm">{label}</span>
                  </li>
                ))}
              </ul>

              <ListBusinessButton
                className="w-full rounded-xl py-3.5 text-center font-bold text-white text-base"
                style={{ background: '#1D9E75' }}>
                List your business free →
              </ListBusinessButton>

              <Link href="/search"
                className="block text-center mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Explore businesses first
              </Link>
            </div>
          </div>

          {/* Trust badge */}
          <p className="text-center text-xs text-gray-400 mt-4">
            No credit card required · Cancel anytime · Launch pricing guaranteed
          </p>
        </div>

        {/* ── Why section ── */}
        <div className="mb-24">
          <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
              Why are we giving everything away?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {WHY.map(({ icon, title, body }) => (
                <div key={title}>
                  <div className="text-4xl mb-4">{icon}</div>
                  <h3 className="font-bold text-lg mb-3 text-gray-900">{title}</h3>
                  <p className="text-gray-600 leading-7">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-4 mb-24">
          {[
            { num: '54',  label: 'African nations' },
            { num: '9',   label: 'Business categories' },
            { num: '$0',  label: 'Cost to list during launch' },
          ].map(({ num, label }) => (
            <div key={label} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <p className="text-4xl font-black mb-1" style={{ color: '#1D9E75' }}>{num}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div className="rounded-3xl p-12 text-center text-white"
          style={{ background: 'linear-gradient(135deg,#053528,#1D9E75)' }}>

          <h2 className="text-4xl font-bold mb-5">
            Be One of Our First Businesses
          </h2>

          <p className="text-lg max-w-2xl mx-auto text-green-100 leading-8 mb-10">
            Claim your listing today, unlock every Pro Store feature free, and start
            reaching thousands of customers across the African diaspora — from Houston
            to New York to Atlanta and beyond.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ListBusinessButton
              className="rounded-xl px-10 py-4 font-bold text-base bg-white"
              style={{ color: '#085041' }}>
              List your business free →
            </ListBusinessButton>

            <Link href="/search"
              className="rounded-xl px-8 py-4 font-semibold text-base border-2 border-white/40 text-white hover:bg-white/10 transition-colors">
              Browse businesses
            </Link>
          </div>

          <p className="mt-6 text-sm text-green-200">
            No credit card · No commitment · Full Pro Store access
          </p>
        </div>

      </section>
    </main>
  )
}