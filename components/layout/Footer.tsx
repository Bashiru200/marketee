'use client'

import Link  from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()

  const links = {
    Discover: [
      { label: 'Explore businesses', href: '/search'       },
      { label: 'Map view',           href: '/map'          },
      { label: 'How it works',       href: '/how-it-works' },
    ],
    'Business owners': [
      { label: 'List your business', href: '/auth/signup' },
      { label: 'Owner dashboard',    href: '/dashboard'   },
      { label: 'Pricing',            href: '/how-it-works'},
    ],
    Company: [
      { label: 'About us', href: '/about'   },
      { label: 'Contact',  href: '/contact' },
      { label: 'FAQ',      href: '/faq'     },
    ],
  }

  const socials = [
    {
      label: 'Facebook',
      href:  'https://www.facebook.com/people/Markeetee/61590491052666/',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href:  'https://www.instagram.com/markeetee_?igsh=MXJ0bW82eWdrYXowdg==',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      href:  'https://wa.me/markeetee',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.413A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.031-1.094l-.29-.173-2.952.839.839-2.875-.19-.298A7.96 7.96 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
        </svg>
      ),
    },
  ]

  return (
    <footer className="border-t border-[#E7DDCA] bg-[#FBF7EF] text-[#053528] dark:border-[#20362d] dark:bg-[#06120e] dark:text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 sm:py-16">

        {/* ── Top section ── */}
        <div className="grid grid-cols-1 gap-10 mb-12 md:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr]">

          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Markeetee"
                width={40} height={40}
                className="rounded-xl bg-white object-contain ring-1 ring-[#E7DDCA] dark:ring-white/10"
              />
              <span className="text-xl font-black">Markeetee</span>
            </div>

            <p className="text-sm leading-7 mb-5 text-[#536A63] dark:text-white/70">
              Africa is here. Find it. Connecting the African diaspora
              with businesses across the United States.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white text-[#085041] ring-1 ring-[#D9CBB4] transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#FBF7EF] dark:bg-white/10 dark:text-white/85 dark:ring-white/10 dark:focus:ring-white dark:focus:ring-offset-[#053528]"
                  onMouseEnter={e => {
                    const colors: Record<string, string> = {
                      Facebook:  '#1877F2',
                      Instagram: '#E1306C',
                      WhatsApp:  '#25D366',
                    }
                    ;(e.currentTarget as HTMLElement).style.background = colors[s.label] ?? '#1D9E75'
                    ;(e.currentTarget as HTMLElement).style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.background = ''
                    ;(e.currentTarget as HTMLElement).style.color = ''
                  }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-black uppercase tracking-[0.16em] mb-4 text-[#7A8C86] dark:text-white/40">
                {section}
              </p>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#536A63] transition-colors duration-150 underline-offset-4 hover:text-[#085041] hover:underline focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#FBF7EF] dark:text-white/75 dark:hover:text-white dark:focus:ring-white dark:focus:ring-offset-[#053528]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-[#E7DDCA] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 dark:border-white/10">

          <p className="text-xs text-[#7A8C86] dark:text-white/40">
            © {year} Markeetee · Built for the African diaspora
          </p>

          <div className="flex gap-5 text-xs text-[#7A8C86] dark:text-white/40">
            {[
              { label: 'Terms',   href: '/terms'   },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="transition-colors hover:text-[#085041] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#085041] focus:ring-offset-2 focus:ring-offset-[#FBF7EF] dark:hover:text-white dark:focus:ring-white dark:focus:ring-offset-[#053528]"
                style={{ color: 'inherit' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
