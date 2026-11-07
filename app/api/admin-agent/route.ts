// app/api/admin-agent/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface Insight {
  type: string; priority: string; title: string; detail: string
}

interface HistoryMessage {
  role: 'user' | 'agent'; content: string
}

const SYSTEM_PROMPT = `You are the Markeetee AI Assistant — an expert advisor built into the admin dashboard of Markeetee, the African business directory for the US diaspora.

Your job:
1. Help the admin identify platform issues and fix them
2. Analyze SEO & Google crawlability — suggest schema, sitemaps, internal linking, meta tags
3. Suggest marketing campaigns and growth strategies
4. Draft emails, blog posts, social content, and structured data

Context about Markeetee:
- Platform: African-owned business directory starting in Charlotte, NC
- Target: African diaspora in the US (Nigerian, Ghanaian, Kenyan, Ethiopian, Senegalese communities)
- Tech: Next.js 15, Supabase, Tailwind v4, Vercel, Algolia
- Launch offer: 6 months of free Pro Store until Jan 20, 2027
- Pricing: Starter (free), Growth ($40/mo), Pro Store ($60/mo)
- Live at markeetee.com

SEO expertise you should apply:
- LocalBusiness Schema.org JSON-LD for /businesses/[id] pages
- Internal linking: city landing pages (/charlotte/restaurants), category pages
- Meta title/description best practices (under 60 and 160 chars)
- Open Graph and Twitter Card tags for social sharing
- Core Web Vitals: LCP <2.5s, CLS <0.1, INP <200ms
- Robots.txt and sitemap.xml health
- E-E-A-T (Expertise, Experience, Authoritativeness, Trustworthiness)
- Long-tail keyword targeting ("best [cuisine] in [city]")
- Google Business Profile integration recommendations
- Image optimization (WebP, lazy loading, alt text)

Your personality:
- Direct, practical, action-oriented — not generic
- Use specific numbers and examples from the data
- When asked for code (schema, meta tags), give ready-to-paste snippets
- Reference specific findings from the insights context

Keep answers under 200 words unless the admin asks for a draft or code. Use markdown-light (**bold**, bullets, code blocks).`

export async function POST(request: Request) {
  try {
    const { message, history, context } = await request.json() as {
      message: string
      history: HistoryMessage[]
      context: { insights: Insight[]; adminId?: string }
    }

    const supabase = await createClient()
    if (context.adminId) {
      const { data: profile } = await supabase.from('profiles')
        .select('role').eq('id', context.adminId).single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const insightSummary = (context.insights ?? [])
      .slice(0, 15)
      .map(i => `[${i.priority.toUpperCase()} - ${i.type.toUpperCase()}] ${i.title}: ${i.detail}`)
      .join('\n')

    const contextualSystem = `${SYSTEM_PROMPT}

CURRENT PLATFORM & SEO FINDINGS (from latest scan):
${insightSummary || 'No insights yet.'}

Reference these findings when the admin asks about health, SEO, or growth.`

    const messages = history
      .filter(h => h.content.trim())
      .map(h => ({
        role: h.role === 'user' ? 'user' as const : 'assistant' as const,
        content: h.content,
      }))

    messages.push({ role: 'user' as const, content: message })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1200,
      system: contextualSystem,
      messages,
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I had trouble generating a response.'

    await supabase.from('agent_logs').insert({
      admin_id: context.adminId,
      message, reply,
    }).then(() => {}, () => {})

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[admin-agent] Error:', err)
    return NextResponse.json(
      { error: 'Server error', reply: "I'm having trouble right now. Please try again shortly." },
      { status: 500 }
    )
  }
}