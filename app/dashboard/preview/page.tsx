import Link from 'next/link'
import {
  BarChart2,
  Crown,
  Edit,
  Eye,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Package,
  Star,
  Tag,
  TrendingUp,
  Zap,
} from 'lucide-react'

const nav = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Listing', icon: Edit },
  { label: 'Products', icon: Package },
  { label: 'Analytics', icon: BarChart2 },
  { label: 'Locations', icon: MapPin, locked: true },
  { label: 'Promotions', icon: Tag, locked: true },
  { label: 'Enquiries', icon: Mail, locked: true },
  { label: 'Reviews', icon: Star },
  { label: 'Upgrade', icon: Crown },
]

const stats = [
  { label: 'Rating', value: '4.8', icon: Star, color: '#F59E0B' },
  { label: 'Reviews', value: '24', icon: Mail, color: '#1D9E75' },
  { label: 'Products', value: '12', icon: Package, color: '#8B5CF6' },
  { label: 'Plan', value: 'Growth', icon: Crown, color: '#085041' },
]

const subscription = [
  { label: 'Current plan', value: 'Growth', detail: '$40/mo · active' },
  { label: 'Photos', value: '9/20', detail: 'Use storefront and product photos' },
  { label: 'Products', value: '12/20', detail: 'Keep your catalog fresh' },
  { label: 'Next best action', value: 'Pro Store', detail: 'Unlock leads, promos, custom URL' },
]

const quickWins = [
  'Add 8 more gallery photos before you hit the Growth limit.',
  'Upgrade to Pro Store when you need direct enquiries and promotions.',
  'Ask recent customers for reviews to keep visibility high.',
]

export default function DashboardPreviewPage() {
  return (
    <div className="min-h-screen bg-[#FBF7EF]">
      <div className="border-b border-[#E7DDCA] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75]">No-login preview</p>
            <h1 className="text-xl font-black text-gray-950">Business Owner Dashboard</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-green-300 hover:text-green-700"
          >
            Open real dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        <div className="flex items-start gap-6">
          <aside className="hidden w-60 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white lg:block">
            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1F5EE] text-lg font-black text-[#085041]">
                  OK
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">Oga Kitchen</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Growth</span>
                </div>
              </div>
            </div>

            <nav className="space-y-0.5 p-3">
              {nav.map(({ label, icon: Icon, active, locked }) => (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    active ? 'bg-[#1D9E75] text-white' : locked ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {locked && <Lock size={12} />}
                </div>
              ))}
            </nav>

            <div className="border-t border-gray-100 p-3">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
                <Eye size={14} /> View listing
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-950">Welcome, Amina</h2>
                <p className="text-sm text-gray-500">Here is how your owner dashboard looks with a Growth subscription.</p>
              </div>
              <div className="hidden rounded-2xl border border-green-100 bg-[#E1F5EE] px-4 py-3 text-sm font-bold text-[#085041] sm:block">
                Visibility score: 82/100
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <Icon className="mb-3" size={16} style={{ color }} />
                  <p className="text-2xl font-black text-gray-950">{value}</p>
                  <p className="mt-1 text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1F5EE]">
                    <Zap size={16} className="text-[#1D9E75]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-950">Subscription snapshot</h3>
                    <p className="text-xs text-gray-400">What the owner can use right now</p>
                  </div>
                </div>
                <span className="rounded-xl bg-[#085041] px-3 py-2 text-xs font-bold text-white">Upgrade</span>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                {subscription.map(item => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                    <p className="mt-1 text-lg font-black text-gray-950">{item.value}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="font-bold text-gray-950">Your listing</h3>
                </div>
                <div className="flex gap-4 p-5">
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-[url('/images/categories/restaurants.jpeg')] bg-cover bg-center" />
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-black text-gray-950">Oga Kitchen</p>
                      <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-bold text-[#085041]">Verified</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-gray-500">
                      Nigerian meals, suya platters, catering trays, and weekend specials for families and events.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">Charlotte, NC · Open Tue-Sun · 12 products listed</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#1D9E75]" />
                  <h3 className="font-bold text-gray-950">Recommended actions</h3>
                </div>
                <div className="space-y-3">
                  {quickWins.map(item => (
                    <div key={item} className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
