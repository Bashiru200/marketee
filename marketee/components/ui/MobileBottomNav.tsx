'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MapPin, Heart, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { isLoggedIn, isOwner } = useAuth()

  // Hide on admin, auth, and dashboard pages
  const hidden = ['/admin', '/auth', '/dashboard'].some(p => pathname.startsWith(p))
  if (hidden) return null

  const customerNav = [
    { href:'/',              icon:Home,          label:'Home'    },
    { href:'/search',        icon:Search,        label:'Explore' },
    { href:'/map',           icon:MapPin,        label:'Map'     },
    { href:'/account/saved', icon:Heart,         label:'Saved'   },
    { href: isLoggedIn
        ? '/account/profile'
        : '/auth/login',     icon:User,          label:'Profile' },
  ]

  const ownerNav = [
    { href:'/',              icon:Home,          label:'Home'       },
    { href:'/search',        icon:Search,        label:'Explore'    },
    { href:'/map',           icon:MapPin,        label:'Map'        },
    { href:'/dashboard',     icon:LayoutDashboard,label:'Dashboard' },
    { href:'/account/profile',icon:User,         label:'Profile'   },
  ]

  const navItems = isOwner ? ownerNav : customerNav

  return (
    <>
      {/* Spacer so content isn't hidden behind the nav */}
      <div className="h-16 md:hidden" />

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-100"
        style={{ paddingBottom:'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon:Icon, label }) => {
            const active = pathname === href ||
              (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
                style={{ color: active ? '#1D9E75' : '#9CA3AF' }}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className="transition-all"
                  />
                  {/* Active dot */}
                  {active && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background:'#1D9E75' }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}