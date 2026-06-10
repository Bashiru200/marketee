'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    'Discover': [
      { label: 'Explore businesses', href: '/search' },
      { label: 'Map view',           href: '/map'    },
      { label: 'How it works',       href: '/how-it-works' },
    ],
    'Business owners': [
      { label: 'List your business', href: '/auth/signup'  },
      { label: 'Owner dashboard',    href: '/dashboard'    },
      { label: 'Pricing',            href: '/how-it-works' },
    ],
    'Your account': [
      { label: 'Saved businesses', href: '/account/saved'    },
      { label: 'My reviews',       href: '/account/reviews'  },
      { label: 'Settings',         href: '/account/settings' },
    ],
    'Company': [
      { label: 'About us',   href: '/about'   },
      { label: 'Contact',    href: '/contact' },
      { label: 'FAQ',        href: '/faq'     },
      { label: 'Terms',      href: '/terms'   },
      { label: 'Privacy',    href: '/privacy' },
    ],
  }

  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                <Image src="/android-chrome-512x512.png" alt="Markeetee" width={80} height={80} />
              </div>
              <span className="font-bold text-xl text-gray-900">Markeetee</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Africa is here. Find it. The African business directory for the diaspora.
            </p>
            <div className="flex gap-2 text-lg">
              {['🇳🇬','🇬🇭','🇰🇪','🇸🇳','🇿🇦'].map(f => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{section}</p>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-sm text-gray-500 hover:text-green-600 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {year} Markeetee · Made with ❤️ for the African diaspora
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms"   className="text-xs text-gray-400 hover:text-green-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-green-600 transition-colors">Privacy</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-green-600 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}