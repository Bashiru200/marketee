// components/admin/AdminAgent.tsx
// Markeetee AI Agent — monitors platform health, SEO/crawlability, and marketing
'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Send, Loader2, TrendingUp, AlertTriangle,
  CheckCircle2, Lightbulb, Megaphone, RefreshCw, X,
  Target, Search,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

type InsightType = 'issue' | 'opportunity' | 'suggestion' | 'win' | 'marketing' | 'seo'
type Priority    = 'critical' | 'high' | 'medium' | 'low'

interface Insight {
  id:       string
  type:     InsightType
  priority: Priority
  title:    string
  detail:   string
  action?:  { label: string; href?: string; onClick?: () => void }
  metric?:  { value: string; change?: string }
}

interface AgentMessage {
  role:      'user' | 'agent'
  content:   string
  timestamp: string
  model?:    string
}

const TYPE_META: Record<InsightType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  issue:       { icon: AlertTriangle,  color:'#B91C1C', bg:'#FEE2E2', label:'Needs attention' },
  opportunity: { icon: TrendingUp,     color:'#1D4ED8', bg:'#DBEAFE', label:'Opportunity'    },
  suggestion:  { icon: Lightbulb,      color:'#92400E', bg:'#FEF3C7', label:'Suggestion'     },
  win:         { icon: CheckCircle2,   color:'#065F46', bg:'#D1FAE5', label:'Win'            },
  marketing:   { icon: Megaphone,      color:'#5B21B6', bg:'#EDE9FE', label:'Marketing'      },
  seo:         { icon: Search,         color:'#0E7490', bg:'#CFFAFE', label:'SEO'            },
}

const PRIORITY_WEIGHT: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 }

export default function AdminAgent() {
  const supabase = createClient()
  const { user } = useAuth()

  const [open,     setOpen]     = useState(false)
  const [tab,      setTab]      = useState<'insights' | 'seo' | 'chat'>('insights')
  const [loading,  setLoading]  = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [seoInsights, setSeoInsights] = useState<Insight[]>([])
  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: 'agent', content: "Hi! I'm your Markeetee AI team — Claude handles strategy, SEO & copy. GPT handles design & UI. I auto-route your questions, or mention @gpt, @claude, or @both to pick manually.", timestamp: new Date().toISOString() },
  ])
  const [input,       setInput]       = useState('')
  const [thinking,    setThinking]    = useState(false)
  const [engineForce, setEngineForce] = useState<'auto' | 'claude' | 'gpt' | 'both'>('auto')
  const [lastScan, setLastScan] = useState<Date | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && insights.length === 0) runScan()
  }, [open])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  // ═══════════════════════════════════════════════════════════════════════
  // Full platform scan — health + SEO
  // ═══════════════════════════════════════════════════════════════════════
  async function runScan() {
    setLoading(true)
    const platformFindings: Insight[] = []
    const seoFindings: Insight[]      = []

    try {
      // ── Platform data ─────────────────────────────────────────────────
      const [
        { count: totalBiz },
        { count: unclaimed },
        { count: noPhotos },
        { count: noDescription },
        { count: shortDescription },
        { count: noHours },
        { count: noCategory },
        { count: hiddenBiz },
        { count: proStoreBiz },
        { count: growthBiz },
        { count: unverified },
        { data: cityDistribution },
      ] = await Promise.all([
        supabase.from('businesses').select('id', { count:'exact', head:true }),
        supabase.from('businesses').select('id', { count:'exact', head:true }).is('owner_id', null),
        supabase.from('businesses').select('id', { count:'exact', head:true }).is('cover_image', null),
        supabase.from('businesses').select('id', { count:'exact', head:true }).or('description.is.null,description.eq.'),
        supabase.from('businesses').select('id', { count:'exact', head:true }).not('description','is',null).filter('description','lt','x'.repeat(100)),
        supabase.from('businesses').select('id', { count:'exact', head:true }).is('hours_open', null),
        supabase.from('businesses').select('id', { count:'exact', head:true }).is('category', null),
        supabase.from('businesses').select('id', { count:'exact', head:true }).eq('status', 'hidden'),
        supabase.from('businesses').select('id', { count:'exact', head:true }).eq('plan', 'pro_store'),
        supabase.from('businesses').select('id', { count:'exact', head:true }).eq('plan', 'growth'),
        supabase.from('businesses').select('id', { count:'exact', head:true }).eq('verified', false),
        supabase.from('businesses').select('city').not('city','is',null),
      ])

      const [
        { count: totalReviews },
        { count: recentReviews },
        { data: recentSignups },
        { count: blogPosts },
        { data: oldBlogs },
      ] = await Promise.all([
        supabase.from('reviews').select('id', { count:'exact', head:true }),
        supabase.from('reviews').select('id', { count:'exact', head:true }).gte('created_at', new Date(Date.now() - 7*86400000).toISOString()),
        supabase.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 7*86400000).toISOString()),
        supabase.from('blog_posts').select('id', { count:'exact', head:true }).eq('published', true),
        supabase.from('blog_posts').select('id,title,slug,published_at,meta_title,meta_desc,cover_image,excerpt').eq('published', true).order('published_at', { ascending: true }).limit(10),
      ])

      // ═══════════════════════════════════════════════════════════════
      // PLATFORM INSIGHTS
      // ═══════════════════════════════════════════════════════════════

      const unclaimedPct = totalBiz ? Math.round(((unclaimed ?? 0) / totalBiz) * 100) : 0
      if ((unclaimed ?? 0) > 0 && unclaimedPct > 30) {
        platformFindings.push({
          id: 'high-unclaimed', type: 'issue', priority: 'critical',
          title: `${unclaimed} businesses are still unclaimed`,
          detail: `${unclaimedPct}% of listings have no owner. Run outreach to invite them to claim and engage.`,
          action: { label: 'Send outreach campaign', href: '/admin?tab=broadcast' },
          metric: { value: `${unclaimed}`, change: `${unclaimedPct}%` },
        })
      }

      if ((noPhotos ?? 0) > 10) {
        platformFindings.push({
          id: 'no-photos', type: 'issue', priority: 'high',
          title: `${noPhotos} businesses have no cover photo`,
          detail: `Listings without photos get 40% fewer clicks. Email these owners with upload instructions.`,
          action: { label: 'Email affected owners', href: '/admin?tab=broadcast' },
          metric: { value: `${noPhotos}` },
        })
      }

      if ((hiddenBiz ?? 0) > 0) {
        platformFindings.push({
          id: 'hidden-count', type: 'suggestion', priority: 'medium',
          title: `${hiddenBiz} businesses are hidden`,
          detail: 'Review moderation log to ensure accurate flagging and avoid wrongful hides.',
          action: { label: 'View moderation log', href: '/admin?tab=moderation' },
        })
      }

      const paidBiz = (proStoreBiz ?? 0) + (growthBiz ?? 0)
      if (totalBiz && paidBiz > 0) {
        const conversionPct = Math.round((paidBiz / totalBiz) * 100)
        if (conversionPct >= 10) {
          platformFindings.push({
            id: 'conversion-win', type: 'win', priority: 'low',
            title: `${conversionPct}% paid conversion rate`,
            detail: `${paidBiz} businesses on paid plans. You're above industry average (5-8%).`,
            metric: { value: `${conversionPct}%`, change: '+' },
          })
        }
      }

      const newUsersLast7 = recentSignups?.length ?? 0
      if (newUsersLast7 > 0) {
        platformFindings.push({
          id: 'growth-weekly', type: 'win', priority: 'low',
          title: `${newUsersLast7} new signups this week`,
          detail: 'Send a welcome batch with top picks in their city to activate them.',
          action: { label: 'Send welcome batch', href: '/admin?tab=broadcast' },
          metric: { value: `+${newUsersLast7}` },
        })
      }

      if ((recentReviews ?? 0) < 3 && (totalBiz ?? 0) > 10) {
        platformFindings.push({
          id: 'review-drought', type: 'opportunity', priority: 'high',
          title: `Only ${recentReviews ?? 0} reviews this week`,
          detail: 'Reviews drive trust & SEO rich results. Launch a review campaign with recent viewers.',
          action: { label: 'Launch review campaign', href: '/admin?tab=broadcast' },
          metric: { value: `${recentReviews ?? 0}` },
        })
      }

      const now = new Date()
      const launchEnd = new Date('2027-01-20')
      const daysToLaunchEnd = Math.ceil((launchEnd.getTime() - now.getTime()) / 86400000)
      if (daysToLaunchEnd > 0 && daysToLaunchEnd < 90) {
        platformFindings.push({
          id: 'launch-reminder', type: 'opportunity', priority: 'high',
          title: `${daysToLaunchEnd} days left in launch access period`,
          detail: `6-month free Pro Store offer ends ${launchEnd.toLocaleDateString('en-US', { month:'long', day:'numeric' })}. Ramp up urgency campaigns.`,
          action: { label: 'Launch urgency campaign', href: '/admin?tab=broadcast' },
          metric: { value: `${daysToLaunchEnd}d` },
        })
      }

      platformFindings.push({
        id: 'marketing-social', type: 'marketing', priority: 'medium',
        title: `Post this week's business spotlight`,
        detail: `Create an Instagram Reel featuring a top-viewed business. Tag the owner, use #SupportBlackBusiness.`,
        action: { label: 'Draft spotlight', onClick: () => setTab('chat') },
      })

      // ═══════════════════════════════════════════════════════════════
      // SEO INSIGHTS (what Google needs for better crawling)
      // ═══════════════════════════════════════════════════════════════

      // 1. Missing descriptions hurt page SEO
      if ((noDescription ?? 0) > 0) {
        seoFindings.push({
          id: 'seo-no-description', type: 'seo', priority: 'high',
          title: `${noDescription} business pages have no description`,
          detail: `Google needs unique descriptive text on every page. Pages without descriptions have thin content and rank poorly. Email these owners or auto-generate placeholder descriptions.`,
          action: { label: 'Email owners', href: '/admin?tab=broadcast' },
          metric: { value: `${noDescription}` },
        })
      }

      // 2. Short descriptions
      if ((shortDescription ?? 0) > 0) {
        seoFindings.push({
          id: 'seo-thin-content', type: 'seo', priority: 'medium',
          title: `${shortDescription} pages have thin descriptions (<100 chars)`,
          detail: `Google deprioritizes thin content. Aim for at least 150-300 characters per listing with keywords like city + category.`,
          action: { label: 'Nudge owners to expand', href: '/admin?tab=broadcast' },
          metric: { value: `${shortDescription}` },
        })
      }

      // 3. Missing categories — breaks category pages & filtering
      if ((noCategory ?? 0) > 0) {
        seoFindings.push({
          id: 'seo-no-category', type: 'seo', priority: 'high',
          title: `${noCategory} businesses have no category`,
          detail: `Uncategorized businesses don't show in category landing pages (/search?category=restaurants), which are your main SEO targets.`,
          action: { label: 'Fix uncategorized', href: '/admin?tab=businesses' },
          metric: { value: `${noCategory}` },
        })
      }

      // 4. Missing photos — bad for OG image social sharing
      if ((noPhotos ?? 0) > 0) {
        seoFindings.push({
          id: 'seo-no-og-image', type: 'seo', priority: 'medium',
          title: `${noPhotos} listings lack an OG image`,
          detail: `Without a cover photo, Facebook/Twitter/WhatsApp previews are blank when shared. Reduces click-through from social shares by ~60%.`,
          metric: { value: `${noPhotos}` },
        })
      }

      // 5. Unverified businesses — lower trust signal
      if ((unverified ?? 0) > 20) {
        seoFindings.push({
          id: 'seo-unverified', type: 'seo', priority: 'low',
          title: `${unverified} businesses are unverified`,
          detail: `Verified badges increase user trust and dwell time (a ranking signal). Review verification queue to batch-approve legitimate ones.`,
          action: { label: 'Review verification queue', href: '/admin?tab=claims' },
          metric: { value: `${unverified}` },
        })
      }

      // 6. Blog content coverage
      if ((blogPosts ?? 0) < 10) {
        seoFindings.push({
          id: 'seo-low-blog', type: 'seo', priority: 'high',
          title: `Only ${blogPosts ?? 0} published blog posts`,
          detail: `Blog posts drive long-tail SEO traffic. Aim for 1-2 new posts per week targeting "best [category] in [city]" searches. Expand beyond Charlotte to Raleigh, Durham, Greensboro, Winston-Salem.`,
          action: { label: 'Draft new blog post', onClick: () => setTab('chat') },
          metric: { value: `${blogPosts ?? 0}` },
        })
      }

      // 7. Blog posts missing meta_title / meta_desc
      const blogsWithoutMeta = (oldBlogs ?? []).filter((b: any) => !b.meta_title || !b.meta_desc).length
      if (blogsWithoutMeta > 0) {
        seoFindings.push({
          id: 'seo-blog-meta', type: 'seo', priority: 'medium',
          title: `${blogsWithoutMeta} blog posts missing SEO meta tags`,
          detail: `Posts without meta_title and meta_desc get auto-generated snippets in Google — usually poor CTR. Add custom meta tags for better search appearance.`,
          action: { label: 'Fix blog SEO', href: '/admin?tab=blog' },
          metric: { value: `${blogsWithoutMeta}` },
        })
      }

      // 8. Blog posts missing cover images (OG image for social)
      const blogsWithoutCover = (oldBlogs ?? []).filter((b: any) => !b.cover_image).length
      if (blogsWithoutCover > 0) {
        seoFindings.push({
          id: 'seo-blog-og', type: 'seo', priority: 'medium',
          title: `${blogsWithoutCover} blog posts without cover images`,
          detail: `Missing cover images = no social preview. Posts shared on Instagram/Twitter get far fewer clicks without them.`,
          action: { label: 'Add cover images', href: '/admin?tab=blog' },
          metric: { value: `${blogsWithoutCover}` },
        })
      }

      // 9. City coverage spread (geographic SEO)
      const cityCounts: Record<string, number> = {}
      ;(cityDistribution ?? []).forEach((b: any) => {
        if (b.city) cityCounts[b.city] = (cityCounts[b.city] ?? 0) + 1
      })
      const topCities = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])
      const totalListed = topCities.reduce((sum, [,c]) => sum + c, 0)
      const concentrationPct = topCities[0] ? Math.round((topCities[0][1] / totalListed) * 100) : 0

      if (concentrationPct > 70) {
        seoFindings.push({
          id: 'seo-concentration', type: 'seo', priority: 'medium',
          title: `${concentrationPct}% of businesses in ${topCities[0][0]}`,
          detail: `Heavy concentration limits your SEO coverage. Google rewards local directories — expand to other NC cities to rank for "[category] in [new city]" searches.`,
          metric: { value: `${concentrationPct}%` },
        })
      }

      // 10. Structured data / schema reminder
      seoFindings.push({
        id: 'seo-schema', type: 'seo', priority: 'medium',
        title: 'Add LocalBusiness schema to listing pages',
        detail: `Google rewards pages with Schema.org JSON-LD markup — rich results, map pack placement, review stars. Add LocalBusiness + Review schema to /businesses/[id] pages.`,
        action: { label: 'Chat for implementation', onClick: () => setTab('chat') },
      })

      // 11. Sitemap health
      seoFindings.push({
        id: 'seo-sitemap', type: 'seo', priority: 'high',
        title: 'Submit sitemap to Google Search Console',
        detail: `Your sitemap.ts is live at markeetee.com/sitemap.xml. Submit it in Google Search Console for faster indexing of new businesses and blog posts.`,
        action: { label: 'Open Search Console', href: 'https://search.google.com/search-console' },
      })

      // 12. Internal linking (big for SEO)
      seoFindings.push({
        id: 'seo-internal-links', type: 'seo', priority: 'medium',
        title: 'Create city & category landing pages',
        detail: `Pages like /charlotte/restaurants, /durham/salons strengthen internal linking and rank for high-intent local searches. Each boosts related business listings.`,
        action: { label: 'Chat for implementation', onClick: () => setTab('chat') },
      })

      // 13. Core Web Vitals reminder
      seoFindings.push({
        id: 'seo-cwv', type: 'seo', priority: 'low',
        title: 'Monitor Core Web Vitals',
        detail: `Google ranks faster sites higher. Check LCP (<2.5s), CLS (<0.1), INP (<200ms) in PageSpeed Insights. Lazy-load images, optimize cover photos to WebP.`,
        action: { label: 'Open PageSpeed', href: 'https://pagespeed.web.dev/analysis?url=https://markeetee.com' },
      })

      // 14. Robots.txt check
      seoFindings.push({
        id: 'seo-robots', type: 'seo', priority: 'low',
        title: 'Verify robots.txt allows crawling',
        detail: `Your robots.ts should allow Googlebot on /, /businesses/*, /search, /map, /blog/* and disallow /admin, /dashboard, /api. Double-check filtered URLs aren't blocking valuable pages.`,
        action: { label: 'View robots.txt', href: '/robots.txt' },
      })

      // Sort by priority
      platformFindings.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
      seoFindings.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])

      setInsights(platformFindings)
      setSeoInsights(seoFindings)
      setLastScan(new Date())
    } catch (err) {
      console.error('[admin-agent] Scan error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || thinking) return

    const userMsg: AgentMessage = { role:'user', content: input, timestamp: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setThinking(true)

    try {
      const res = await fetch('/api/admin-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-6),
          context: {
            insights: [...insights, ...seoInsights].slice(0, 15),
            adminId: user?.id,
          },
          engineOverride: engineForce === 'auto' ? undefined : engineForce,
        }),
      })
      const data = await res.json()
      setMessages(m => [...m, {
        role:    'agent',
        content: data.reply ?? 'I had trouble processing that.',
        timestamp: new Date().toISOString(),
        model:   data.modelUsed,
      }])
    } catch {
      setMessages(m => [...m, {
        role:'agent',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setThinking(false)
    }
  }

  const criticalPlatform = insights.filter(i => i.priority === 'critical' || i.priority === 'high').length
  const criticalSeo      = seoInsights.filter(i => i.priority === 'critical' || i.priority === 'high').length
  const totalCritical    = criticalPlatform + criticalSeo

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-xl text-white font-semibold text-sm hover:scale-105 transition-transform"
        style={{ background:'linear-gradient(135deg,#053528,#1D9E75)' }}>
        <div className="relative">
          <Sparkles size={18} />
          {totalCritical > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </div>
        AI Assistant
        {totalCritical > 0 && (
          <span className="ml-1 bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {totalCritical}
          </span>
        )}
      </button>
    )
  }

  const currentList = tab === 'seo' ? seoInsights : insights

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-24px)] h-[640px] max-h-[calc(100vh-80px)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">

      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0"
        style={{ background:'linear-gradient(135deg,#053528,#085041)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(255,255,255,0.15)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm">Markeetee AI Assistant</h3>
            <p className="text-[11px]" style={{ color:'#9FE1CB' }}>
              {lastScan ? `Scanned ${new Date(lastScan).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}` : 'Preparing scan…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={runScan} disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center disabled:opacity-50"
            title="Refresh">
            <RefreshCw size={13} className={`text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* 3 tabs: Health / SEO / Chat */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button onClick={() => setTab('insights')}
          className="flex-1 py-3 text-xs font-semibold transition-colors relative"
          style={{ color: tab === 'insights' ? '#085041' : '#9CA3AF' }}>
          <Target size={12} className="inline mr-1" />
          Health
          {criticalPlatform > 0 && (
            <span className="ml-1 bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {criticalPlatform}
            </span>
          )}
          {tab === 'insights' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#1D9E75' }} />
          )}
        </button>
        <button onClick={() => setTab('seo')}
          className="flex-1 py-3 text-xs font-semibold transition-colors relative"
          style={{ color: tab === 'seo' ? '#0E7490' : '#9CA3AF' }}>
          <Search size={12} className="inline mr-1" />
          SEO
          {criticalSeo > 0 && (
            <span className="ml-1 bg-cyan-100 text-cyan-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {criticalSeo}
            </span>
          )}
          {tab === 'seo' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#0E7490' }} />
          )}
        </button>
        <button onClick={() => setTab('chat')}
          className="flex-1 py-3 text-xs font-semibold transition-colors relative"
          style={{ color: tab === 'chat' ? '#085041' : '#9CA3AF' }}>
          <Sparkles size={12} className="inline mr-1" />
          Ask AI
          {tab === 'chat' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'#1D9E75' }} />
          )}
        </button>
      </div>

      {/* INSIGHTS or SEO list */}
      {(tab === 'insights' || tab === 'seo') && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin mb-3" style={{ color:'#1D9E75' }} />
              <p className="text-xs text-gray-400">
                {tab === 'seo' ? 'Analyzing Google crawlability…' : 'Scanning platform health…'}
              </p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color:'#1D9E75' }} />
              <p className="text-sm font-semibold text-gray-900">All healthy!</p>
              <p className="text-xs text-gray-500 mt-1">No action needed.</p>
            </div>
          ) : (
            currentList.map(ins => {
              const meta = TYPE_META[ins.type]
              const Icon = meta.icon
              return (
                <div key={ins.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg }}>
                      <Icon size={15} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        {ins.priority === 'critical' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background:'#FEE2E2', color:'#B91C1C' }}>
                            URGENT
                          </span>
                        )}
                        {ins.metric && (
                          <span className="ml-auto text-sm font-bold" style={{ color: meta.color }}>
                            {ins.metric.value}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">
                        {ins.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        {ins.detail}
                      </p>
                      {ins.action && (
                        ins.action.href ? (
                          <a href={ins.action.href}
                            target={ins.action.href.startsWith('http') ? '_blank' : undefined}
                            rel={ins.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                            style={{ color: tab === 'seo' ? '#0E7490' : '#1D9E75' }}>
                            {ins.action.label} →
                          </a>
                        ) : (
                          <button onClick={ins.action.onClick}
                            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                            style={{ color: tab === 'seo' ? '#0E7490' : '#1D9E75' }}>
                            {ins.action.label} →
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* CHAT tab */}
      {tab === 'chat' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.role === 'agent' && m.model && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"
                    style={{
                      background: m.model.includes('GPT') && m.model.includes('Claude') ? '#EDE9FE'
                                : m.model.includes('GPT') ? '#DCFCE7'
                                : '#DBEAFE',
                      color:      m.model.includes('GPT') && m.model.includes('Claude') ? '#5B21B6'
                                : m.model.includes('GPT') ? '#15803D'
                                : '#1E40AF',
                    }}>
                    {m.model}
                  </span>
                )}
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
                  style={m.role === 'user'
                    ? { background:'#1D9E75', color:'white' }
                    : { background:'#F3F4F6', color:'#111827' }
                  }>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay:'0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay:'150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay:'300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
              {[
                "What's hurting growth?",
                '@gpt Redesign the hero',
                'Write LocalBusiness schema',
                '@both Improve map UX',
                '@gpt New business card',
              ].map(prompt => (
                <button key={prompt}
                  onClick={() => { setInput(prompt); setTimeout(() => sendMessage(), 0) }}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 transition-colors">
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Engine switcher — route between Claude, GPT, both, or auto */}
          <div className="px-3 pt-2 flex gap-1 flex-shrink-0 border-t border-gray-100">
            {([
              { value:'auto',   label:'Auto',   emoji:'✨', bg:'#E1F5EE', color:'#085041' },
              { value:'claude', label:'Claude', emoji:'🧠', bg:'#DBEAFE', color:'#1E40AF' },
              { value:'gpt',    label:'GPT',    emoji:'🎨', bg:'#DCFCE7', color:'#15803D' },
              { value:'both',   label:'Both',   emoji:'🤝', bg:'#EDE9FE', color:'#5B21B6' },
            ] as const).map(e => (
              <button key={e.value} type="button"
                onClick={() => setEngineForce(e.value)}
                className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={engineForce === e.value
                  ? { background: e.bg, color: e.color }
                  : { background: 'transparent', color: '#9CA3AF' }
                }>
                {e.emoji} {e.label}
              </button>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-3 flex gap-2 flex-shrink-0">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about growth, SEO, marketing…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent" />
            <button type="submit" disabled={!input.trim() || thinking}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90"
              style={{ background:'#1D9E75' }}>
              {thinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </>
      )}
    </div>
  )
}