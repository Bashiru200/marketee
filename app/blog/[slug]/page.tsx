// app/blog/[slug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, ArrowLeft, ArrowRight, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, meta_title, meta_desc')
    .eq('slug', slug).eq('published', true).single()

  if (!post) return { title: 'Post not found' }
  return {
    title:       post.meta_title ?? `${post.title} | Markeetee`,
    description: post.meta_desc  ?? post.excerpt ?? '',
    openGraph: {
      title:       post.title,
      description: post.excerpt ?? '',
      images:      post.cover_image ? [post.cover_image] : ['/og-default.png'],
      type:        'article',
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug).eq('published', true).single()

  if (!post) notFound()

  // Increment view count (fire and forget)
  supabase.from('blog_posts').update({ views: (post.views ?? 0) + 1 }).eq('id', post.id).then()

  // Get related posts
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, slug, title, cover_image, published_at, read_time')
    .eq('published', true).neq('id', post.id)
    .eq('category', post.category)
    .order('published_at', { ascending: false }).limit(3)

  return (
    <main className="min-h-screen bg-white">

      {/* ── Article header ── */}
      <article>
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <Link href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft size={14} /> Back to blog
          </Link>

          <div className="flex items-center gap-2 text-xs mb-4">
            {post.category && (
              <span className="font-bold uppercase tracking-wider" style={{ color:'#1D9E75' }}>
                {post.category}
              </span>
            )}
            {post.city && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500 flex items-center gap-1">
                  <MapPin size={11} /> {post.city}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg md:text-xl text-gray-500 leading-8 mb-6">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 pb-6 border-b border-gray-100 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {post.published_at && new Date(post.published_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> {post.read_time} min read
              </span>
            )}
            <span>By {post.author}</span>
          </div>
        </div>

        {/* Cover image */}
        {post.cover_image && (
          <div className="max-w-4xl mx-auto px-4 mt-8">
            <img src={post.cover_image} alt={post.title}
              className="w-full aspect-video object-cover rounded-3xl" />
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <style>{`
            .blog-content { color: #374151; line-height: 1.8; font-size: 17px; }
            .blog-content h2 { font-size: 26px; font-weight: 700; color: #111827; margin: 40px 0 16px; line-height: 1.3; }
            .blog-content h3 { font-size: 20px; font-weight: 700; color: #111827; margin: 32px 0 12px; }
            .blog-content p  { margin: 0 0 20px; }
            .blog-content a  { color: #085041; font-weight: 600; text-decoration: none; }
            .blog-content a:hover { text-decoration: underline; }
            .blog-content strong { color: #111827; font-weight: 600; }
            .blog-content ul { list-style: disc; padding-left: 24px; margin: 0 0 24px; }
            .blog-content li { margin: 6px 0; }
            .blog-content blockquote {
              border-left: 4px solid #1D9E75;
              background: #E1F5EE;
              padding: 14px 20px;
              border-radius: 0 12px 12px 0;
              margin: 24px 0;
              color: #085041;
              font-style: normal;
            }
            .blog-content blockquote p { margin: 0; }
          `}</style>
        </div>

        {/* ── CTA card ── */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <div className="rounded-3xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg,#053528,#1D9E75)' }}>
            <p className="text-sm uppercase tracking-widest font-bold mb-2" style={{ color:'#9FE1CB' }}>
              Discover more
            </p>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Find African-owned businesses near you.
            </h3>
            <p className="text-green-100 mb-6 max-w-lg mx-auto">
              Markeetee is the go-to directory for African restaurants, groceries, beauty salons and more across the US.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/search"
                className="rounded-2xl px-6 py-3 font-bold bg-white"
                style={{ color:'#085041' }}>
                Explore businesses
              </Link>
              <Link href="/map"
                className="rounded-2xl px-6 py-3 font-bold border-2 border-white/40 text-white">
                View map
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* ── Related posts ── */}
      {related && related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related reading</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map(r => (
              <Link key={r.id} href={`/blog/${r.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {r.cover_image ? (
                    <img src={r.cover_image} alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl"
                      style={{ background:'linear-gradient(135deg,#E1F5EE,#9FE1CB)' }}>
                      🌍
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#1D9E75] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {r.published_at && new Date(r.published_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                    {r.read_time && ` · ${r.read_time} min`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}