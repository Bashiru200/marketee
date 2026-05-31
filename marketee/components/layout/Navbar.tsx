// 'use client'
// import { useState, useRef, useEffect } from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import {
//   Search, Menu, X, MapPin, LayoutDashboard,
//   User, Settings, LogOut, ChevronDown,
//   BookOpen, Heart, Star, Building2
// } from 'lucide-react'
// import { useAuth } from '@/lib/auth'

// export default function Navbar() {
//   const router = useRouter()
//   const { user, profile, isOwner, isLoggedIn, signOut } = useAuth()
//   const [mobileOpen,  setMobileOpen]  = useState(false)
//   const [profileOpen, setProfileOpen] = useState(false)
//   const profileRef = useRef<HTMLDivElement>(null)

//   // Close profile menu when clicking outside
//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
//         setProfileOpen(false)
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [])

//   async function handleSignOut() {
//     setProfileOpen(false)
//     setMobileOpen(false)
//     await signOut()
//     router.push('/')
//     router.refresh()
//   }

//   const initials = profile?.name
//     ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
//     : user?.email?.[0].toUpperCase() ?? '?'

//   const displayName = profile?.name?.split(' ')?.[0] ?? user?.email?.split('@')?.[0] ?? 'Account'

//   const ownerMenuItems = [
//     { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
//     { icon: Building2,       label: 'My business',    href: '/dashboard?tab=listing' },
//     { icon: Star,            label: 'My reviews',     href: '/dashboard?tab=reviews' },
//     { icon: Settings,        label: 'Account settings', href: '/account' },
//   ]

//   const customerMenuItems = [
//     { icon: User,     label: 'My profile',    href: '/account' },
//     { icon: Heart,    label: 'Saved places',  href: '/account/saved' },
//     { icon: BookOpen, label: 'My reviews',    href: '/account/reviews' },
//     { icon: Settings, label: 'Settings',      href: '/account/settings' },
//   ]

//   const menuItems = isOwner ? ownerMenuItems : customerMenuItems

//   return (
//     <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
//       <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

//         {/* Logo */}
//         <Link href="/" className="flex items-center gap-2 flex-shrink-0">
//           <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
//             style={{ background: '#1D9E75' }}>M</div>
//           <span className="font-bold text-xl text-gray-900">Markeetee</span>
//         </Link>

//         {/* Desktop nav */}
//         <nav className="hidden md:flex items-center gap-5">
//           <Link href="/search" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
//             <Search size={14} /> Explore
//           </Link>
//           <Link href="/map" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
//             <MapPin size={14} /> Map
//           </Link>
//           {isOwner && (
//             <Link href="/dashboard" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
//               <LayoutDashboard size={14} /> Dashboard
//             </Link>
//           )}

//           {isLoggedIn ? (
//             /* ── Profile dropdown trigger ── */
//             <div className="relative" ref={profileRef}>
//               <button
//                 onClick={() => setProfileOpen(!profileOpen)}
//                 className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
//               >
//                 {/* Avatar */}
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
//                   style={{ background: '#085041' }}>
//                   {initials}
//                 </div>
//                 <span className="text-sm text-gray-700 font-medium max-w-[80px] truncate">{displayName}</span>
//                 <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
//               </button>

//               {/* ── Dropdown panel ── */}
//               {profileOpen && (
//                 <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">

//                   {/* User info header */}
//                   <div className="px-4 py-4 border-b border-gray-100" style={{ background: '#f0faf6' }}>
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
//                         style={{ background: '#085041' }}>
//                         {initials}
//                       </div>
//                       <div className="min-w-0">
//                         <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? displayName}</p>
//                         <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//                         <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1"
//                           style={{ background: isOwner ? '#1D9E75' : '#E1F5EE', color: isOwner ? '#fff' : '#085041' }}>
//                           {isOwner ? 'Business owner' : 'Customer'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Menu items */}
//                   <div className="py-2">
//                     {menuItems.map(({ icon: Icon, label, href }) => (
//                       <Link key={label} href={href}
//                         onClick={() => setProfileOpen(false)}
//                         className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
//                         <Icon size={15} className="text-gray-400 flex-shrink-0" />
//                         {label}
//                       </Link>
//                     ))}
//                   </div>

//                   {/* Logout */}
//                   <div className="border-t border-gray-100 py-2">
//                     <button onClick={handleSignOut}
//                       className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
//                       <LogOut size={15} className="flex-shrink-0" />
//                       Sign out
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//           ) : (
//             /* ── Guest buttons ── */
//             <>
//               <Link href="/auth/login"
//                 className="text-sm text-gray-600 hover:text-green-700 transition-colors">
//                 Sign in
//               </Link>
//               <Link href="/auth/signup"
//                 className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
//                 style={{ background: '#1D9E75' }}>
//                 List your business
//               </Link>
//             </>
//           )}
//         </nav>

//         {/* Mobile hamburger */}
//         <button className="md:hidden p-1 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
//           {mobileOpen ? <X size={20} /> : <Menu size={20} />}
//         </button>
//       </div>

//       {/* ── Mobile menu ── */}
//       {mobileOpen && (
//         <div className="md:hidden border-t bg-white">

//           {/* User info (logged in) */}
//           {isLoggedIn && (
//             <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3" style={{ background: '#f0faf6' }}>
//               <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
//                 style={{ background: '#085041' }}>
//                 {initials}
//               </div>
//               <div className="min-w-0">
//                 <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? displayName}</p>
//                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//                 <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5"
//                   style={{ background: isOwner ? '#1D9E75' : '#E1F5EE', color: isOwner ? '#fff' : '#085041' }}>
//                   {isOwner ? 'Business owner' : 'Customer'}
//                 </span>
//               </div>
//             </div>
//           )}

//           <div className="px-4 py-3 space-y-1">
//             <Link href="/search" className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50"
//               onClick={() => setMobileOpen(false)}><Search size={14} className="text-gray-400" /> Explore</Link>
//             <Link href="/map" className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50"
//               onClick={() => setMobileOpen(false)}><MapPin size={14} className="text-gray-400" /> Map</Link>

//             {isLoggedIn ? (
//               <>
//                 {isOwner && (
//                   <Link href="/dashboard" className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50"
//                     onClick={() => setMobileOpen(false)}><LayoutDashboard size={14} className="text-gray-400" /> Dashboard</Link>
//                 )}
//                 {menuItems.map(({ icon: Icon, label, href }) => (
//                   <Link key={label} href={href}
//                     onClick={() => setMobileOpen(false)}
//                     className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
//                     <Icon size={14} className="text-gray-400" /> {label}
//                   </Link>
//                 ))}
//                 <button onClick={handleSignOut}
//                   className="w-full flex items-center gap-2 py-2.5 text-sm text-red-500 mt-1">
//                   <LogOut size={14} /> Sign out
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link href="/auth/login" className="flex items-center gap-2 py-2.5 text-sm text-gray-700"
//                   onClick={() => setMobileOpen(false)}><User size={14} className="text-gray-400" /> Sign in</Link>
//                 <Link href="/auth/signup"
//                   className="block text-center text-white py-2.5 rounded-xl text-sm font-medium mt-3"
//                   style={{ background: '#1D9E75' }}
//                   onClick={() => setMobileOpen(false)}>
//                   List your business
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </header>
//   )
// }

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Menu, X, MapPin, LayoutDashboard,
  User, Settings, LogOut, ChevronDown,
  Heart, Star, Building2, BookOpen
} from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function Navbar() {
  const router = useRouter()
  const { user, profile, isOwner, isLoggedIn, signOut } = useAuth()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleSignOut() {
    setProfileOpen(false)
    setMobileOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?'

  const displayName = profile?.name?.split(' ')?.[0] ?? user?.email?.split('@')?.[0] ?? 'Account'

  const ownerMenu = [
    { icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard'         },
    { icon: Building2,       label: 'My business',     href: '/dashboard?tab=listing' },
    { icon: Star,            label: 'My reviews',      href: '/dashboard?tab=reviews' },
    { icon: Settings,        label: 'Account settings',href: '/account/settings'  },
  ]

  const customerMenu = [
    { icon: User,     label: 'My profile',     href: '/account/profile' },
    { icon: Heart,    label: 'Saved places',   href: '/account/saved'    },
    { icon: BookOpen, label: 'My reviews',     href: '/account/reviews'  },
    { icon: Settings, label: 'Settings',       href: '/account/settings' },
  ]

  const menuItems = isOwner ? ownerMenu : customerMenu

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: '#1D9E75' }}>M</div>
          <span className="font-bold text-xl text-gray-900">Markeetee</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          <Link href="/search" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
            <Search size={14} /> Explore
          </Link>
          <Link href="/map" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
            <MapPin size={14} /> Map
          </Link>
          {isOwner && (
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          )}

          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ background: '#085041' }}>
                    {initials}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium max-w-[80px] truncate">{displayName}</span>
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                  {/* User info */}
                  <div className="px-4 py-4 border-b border-gray-100" style={{ background: '#f0faf6' }}>
                    <div className="flex items-center gap-3">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: '#085041' }}>
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 capitalize"
                          style={{ background: isOwner ? '#1D9E75' : '#E1F5EE', color: isOwner ? '#fff' : '#085041' }}>
                          {isOwner ? 'Business owner' : 'Customer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    {menuItems.map(({ icon: Icon, label, href }) => (
                      <Link key={label} href={href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Icon size={15} className="text-gray-400 flex-shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-gray-100 py-2">
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={15} className="flex-shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-green-700 transition-colors">
                Sign in
              </Link>
              <Link href="/auth/signup"
                className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
                style={{ background: '#1D9E75' }}>
                List your business
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden p-1 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          {isLoggedIn && (
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3" style={{ background: '#f0faf6' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: '#085041' }}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name ?? displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 capitalize"
                  style={{ background: isOwner ? '#1D9E75' : '#E1F5EE', color: isOwner ? '#fff' : '#085041' }}>
                  {isOwner ? 'Business owner' : 'Customer'}
                </span>
              </div>
            </div>
          )}

          <div className="px-4 py-3 space-y-1">
            <Link href="/search" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
              <Search size={14} className="text-gray-400" /> Explore
            </Link>
            <Link href="/map" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
              <MapPin size={14} className="text-gray-400" /> Map
            </Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
              How it works
            </Link>

            {isLoggedIn ? (
              <>
                {isOwner && (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
                    <LayoutDashboard size={14} className="text-gray-400" /> Dashboard
                  </Link>
                )}
                {menuItems.map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-700 border-b border-gray-50">
                    <Icon size={14} className="text-gray-400" /> {label}
                  </Link>
                ))}
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2 py-2.5 text-sm text-red-500 mt-1">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-sm text-gray-700">
                  <User size={14} className="text-gray-400" /> Sign in
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)}
                  className="block text-center text-white py-2.5 rounded-xl text-sm font-medium mt-3"
                  style={{ background: '#1D9E75' }}>
                  List your business
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}