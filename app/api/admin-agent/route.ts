// app/api/admin-agent/route.ts
// Hybrid AI agent — routes between Claude (analysis, SEO, content) and GPT (design, visual, code generation)
// Both models receive your platform context and can collaborate on the same conversation.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { authErrorResponse, requireAdminAccess } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Insight {
  type: string; priority: string; title: string; detail: string
}

interface HistoryMessage {
  role: 'user' | 'agent'; content: string
}

type Engine = 'claude' | 'gpt' | 'both'

// ═══════════════════════════════════════════════════════════════════════════
// System prompts — each model gets a role-specific prompt
// ═══════════════════════════════════════════════════════════════════════════

const CLAUDE_PROMPT = `You are the **Markeetee Strategist** — Claude, the analytical half of a 2-model advisor team for Markeetee (African business directory, US diaspora, launched Charlotte NC).

Your strengths:
- Deep analysis of platform health & user behavior
- SEO, Google crawlability, schema markup, meta tags
- Marketing strategy, campaign copy, outreach sequences
- Content writing: blog posts, emails, scripts
- Business logic and data interpretation

Context:
- markeetee.com — Next.js 15, Supabase, Tailwind v4, Vercel, Algolia
- Pricing: Starter (free), Growth ($40/mo), Pro Store ($60/mo)
- Launch offer: 6 months free Pro Store until Jan 20, 2027
- Target: Nigerian, Ghanaian, Kenyan, Ethiopian, Senegalese diaspora

When you receive a question, focus on your strengths: analysis, SEO, marketing, copy.
If the question is about **design, visuals, UI mockups, animation, or CSS/component styling** — say briefly: "This is a design question — let me hand it to GPT." and keep your answer short.

Keep responses under 200 words unless drafting content. Use markdown-light (**bold**, bullets, code blocks).`

const GPT_PROMPT = `You are the **Markeetee Designer** — GPT, the creative half of a 2-model advisor team for Markeetee (African business directory, US diaspora, launched Charlotte NC).

Your strengths:
- Visual design, UI/UX, component mockups
- Tailwind CSS, animation, micro-interactions
- Design system refinement (colors, spacing, typography)
- Figma-style layout descriptions and CSS
- Icons, illustrations, visual hierarchy

Brand:
- Colors: #053528 (dark green), #085041 (mid green), #1D9E75 (brand green), #9FE1CB (mint), #E1F5EE (light mint)
- Tagline: "Africa is here. Find it."
- Vibe: Warm, modern, diaspora-focused, rounded corners (rounded-2xl, rounded-3xl)
- Typography: System fonts, bold hierarchy, tight tracking on headlines

When you receive a question focus on your strengths: visuals, UI, design, components, styling.
If the question is about **strategy, analytics, SEO, email copy, or marketing plans** — say briefly: "This is a strategy question — let me hand it to Claude." and keep your answer short.

Keep responses under 300 words. Give ready-to-paste Tailwind / React / CSS code. Use markdown with code blocks.`

// ═══════════════════════════════════════════════════════════════════════════
// Engine router — decides who answers (or if both should collaborate)
// ═══════════════════════════════════════════════════════════════════════════

function pickEngine(message: string): Engine {
  const m = message.toLowerCase()

  // Explicit routing
  if (m.includes('@gpt') || m.includes('@chatgpt'))       return 'gpt'
  if (m.includes('@claude') || m.includes('@anthropic')) return 'claude'
  if (m.includes('@both') || m.includes('collab'))        return 'both'

  // Design keywords → GPT
  const designWords = ['design', 'layout', 'ui', 'component', 'tailwind',
    'css', 'animation', 'animate', 'color', 'spacing', 'typography',
    'mockup', 'figma', 'style', 'visual', 'look', 'theme', 'icon',
    'illustration', 'hero', 'landing page', 'redesign']
  if (designWords.some(w => m.includes(w))) return 'gpt'

  // Strategy keywords → Claude
  const strategyWords = ['seo', 'schema', 'ranking', 'google', 'meta tag',
    'sitemap', 'crawlability', 'blog post', 'email', 'outreach',
    'marketing', 'campaign', 'strategy', 'analytics', 'metric',
    'conversion', 'growth', 'launch']
  if (strategyWords.some(w => m.includes(w))) return 'claude'

  // Default to Claude for general analysis
  return 'claude'
}

// ═══════════════════════════════════════════════════════════════════════════
// Model callers
// ═══════════════════════════════════════════════════════════════════════════

async function callClaude(
  system: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const messages = [...history, { role: 'user' as const, content: message }]
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1200,
    system,
    messages,
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function callGpt(
  system: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  message: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1200,
    messages: [
      { role: 'system', content: system },
      ...history.map(h => ({
        role: h.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}

// ═══════════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAccess()
    const { message, history, context, engineOverride } = await request.json() as {
      message:         string
      history:         HistoryMessage[]
      context:         { insights: Insight[]; adminId?: string }
      engineOverride?: Engine
    }

    const supabase = await createClient()

    // Build shared platform context
    const insightSummary = (context.insights ?? [])
      .slice(0, 15)
      .map(i => `[${i.priority.toUpperCase()} - ${i.type.toUpperCase()}] ${i.title}: ${i.detail}`)
      .join('\n')

    const contextBlock = `

CURRENT PLATFORM & SEO FINDINGS (both models see this):
${insightSummary || 'No insights yet.'}

Reference these when relevant.`

    const claudeSystem = CLAUDE_PROMPT + contextBlock
    const gptSystem    = GPT_PROMPT    + contextBlock

    // Build cleaned history
    const cleanHistory = history
      .filter(h => h.content.trim())
      .map(h => ({
        role: h.role === 'user' ? 'user' as const : 'assistant' as const,
        content: h.content,
      }))

    // Decide who answers
    const engine: Engine = engineOverride ?? pickEngine(message)

    let reply = ''
    let modelUsed: string = ''

    if (engine === 'claude') {
      reply = await callClaude(claudeSystem, cleanHistory, message)
      modelUsed = 'Claude (Strategist)'
    }
    else if (engine === 'gpt') {
      reply = await callGpt(gptSystem, cleanHistory, message)
      modelUsed = 'GPT (Designer)'
    }
    else {
      // BOTH — Claude answers first, GPT reviews and adds visual/design angle
      const claudeReply = await callClaude(claudeSystem, cleanHistory, message)

      const gptPrompt = `The admin asked: "${message}"

My partner Claude (strategist) answered:
"""
${claudeReply}
"""

Review this and add YOUR design/visual perspective. Don't repeat what Claude said — expand it with concrete UI, Tailwind code, or visual suggestions. Keep it short (under 200 words).`

      const gptReply = await callGpt(gptSystem, cleanHistory, gptPrompt)

      reply = `**🧠 Claude (Strategist):**\n\n${claudeReply}\n\n---\n\n**🎨 GPT (Designer):**\n\n${gptReply}`
      modelUsed = 'Claude + GPT (Collaboration)'
    }

    // Log
    await supabase.from('agent_logs').insert({
      admin_id: admin.id,
      message,
      reply,
      model: modelUsed,
    }).then(() => {}, () => {})

    return NextResponse.json({ reply, modelUsed })

  } catch (err) {
    try {
      return authErrorResponse(err)
    } catch {}

    console.error('[admin-agent] Error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      error: 'Server error',
      reply: `I'm having trouble. ${msg.includes('OPENAI') ? 'OpenAI key may be missing.' : msg.includes('ANTHROPIC') ? 'Anthropic key may be missing.' : 'Please try again shortly.'}`,
    }, { status: 500 })
  }
}
