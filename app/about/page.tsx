import Link from 'next/link'
import ListBusinessButton from '@/components/ui/ListBusinessButton'

export const metadata = { title: 'About Markeetee' }

export default function AboutPage() {
  const stats = [
    { num: '420+', label: 'African businesses' },
    { num: '6',    label: 'US cities' },
    { num: '54',   label: 'Countries represented' },
    { num: '12k+', label: 'Diaspora users' },
  ]
  const team = [
    { name: 'The Markeetee Team', role: 'Building bridges between the African diaspora and home', emoji: '🌍' },
  ]
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Africa is here. <span style={{ color:'#1D9E75' }}>Find it.</span></h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Markeetee is the African business directory built for the diaspora. We connect African-owned businesses in the USA
          with the millions of diaspora customers who are already searching for them.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {stats.map(s => (
          <div key={s.label} className="text-center p-6 rounded-2xl border border-gray-100 bg-white">
            <p className="text-3xl font-bold mb-1" style={{ color:'#1D9E75' }}>{s.num}</p>
            <p className="text-sm text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our story</h2>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>Markeetee was born from a simple frustration shared by millions of Africans living in the United States — finding authentic African food, fashion, beauty services, and culture in a new city is harder than it should be.</p>
          <p>African-owned businesses exist in every major US city, but they're invisible online. They don't appear in general search results, they rely on word of mouth, and they lose customers every day simply because people can't find them.</p>
          <p>We built Markeetee to change that. Starting in Houston, Texas — home to over 600,000 Nigerian-Americans — we're creating the dedicated platform that African businesses deserve and that diaspora communities need.</p>
        </div>
      </div>

      {/* Mission */}
      <div className="rounded-2xl p-8 mb-8 text-white" style={{ background:'linear-gradient(135deg,#085041,#1D9E75)' }}>
        <h2 className="text-2xl font-bold mb-3">Our mission</h2>
        <p className="text-green-100 leading-relaxed text-lg">
          To connect every African diaspora community in the USA with the African-owned businesses, products, and culture that make them feel at home — wherever they are.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Join the community</h2>
        <p className="text-gray-500 mb-6">Whether you're a customer looking for home or a business owner ready to be found.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl" style={{ background:'#1D9E75' }}>
            Explore businesses
          </Link>
          <ListBusinessButton className="inline-block text-sm font-semibold px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-green-300 transition-colors" />
        </div>
      </div>
    </div>
  )
}