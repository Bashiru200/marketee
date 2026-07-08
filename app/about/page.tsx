import Link from 'next/link'
import ListBusinessButton from '@/components/ui/ListBusinessButton'

export const metadata = {
  title: 'About Markeetee',
  description:
    'Markeetee connects the African diaspora with African-owned businesses, products, services, and culture across the United States.',
}

export default function AboutPage() {
  const values = [
    {
      icon: '🌍',
      title: 'Built for the diaspora',
      body: 'We help people find African food, groceries, fashion, beauty, wellness, services, and culture wherever they are.',
    },
    {
      icon: '🏪',
      title: 'Made for business owners',
      body: 'We give African-owned businesses a dedicated place to be discovered, reviewed, promoted, and supported.',
    },
    {
      icon: '🤝',
      title: 'Rooted in community',
      body: 'Markeetee is more than a directory. It is a bridge between local businesses and the communities that love them.',
    },
  ]

  const categories = [
    'Food & Groceries',
    'Restaurants',
    'Fashion & Fabric',
    'Beauty & Hair',
    'Herbs & Wellness',
    'Music & Arts',
    'Crafts & Decor',
    'Services',
  ]

  return (
    <main className="bg-[#F8FAF9] min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#1D9E75' }}>
            About Markeetee
          </p>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Africa is here.{' '}
            <span style={{ color: '#1D9E75' }}>Find it.</span>
          </h1>

          <p className="text-lg text-gray-600 leading-8">
            Markeetee is a discovery platform built to help the African diaspora
            find African-owned businesses across the United States — from
            restaurants and grocery stores to fashion, beauty, wellness, services,
            and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {values.map((item) => (
            <div key={item.title} className="bg-white rounded-3xl border border-gray-100 p-7">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h2>
              <p className="text-sm text-gray-500 leading-7">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Why Markeetee exists</h2>

          <div className="space-y-5 text-gray-600 leading-8">
            <p>
              Many African-owned businesses are loved by their communities, but
              they are still difficult to find online. Customers often depend on
              word of mouth, scattered social media posts, or old search results
              to find the food, products, and services that feel like home.
            </p>

            <p>
              Markeetee was created to solve that problem. We give African
              businesses a dedicated home online and make it easier for customers
              to discover, support, review, and connect with them.
            </p>

            <p>
              Our goal is simple: make African businesses more visible and make
              diaspora communities feel more connected, wherever they live.
            </p>
          </div>
        </div>

        <div className="rounded-3xl p-8 md:p-10 mb-8 text-white" style={{ background: '#085041' }}>
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#9FE1CB' }}>
            Our mission
          </p>

          <h2 className="text-3xl font-bold mb-4">
            Building the bridge between African businesses and the diaspora.
          </h2>

          <p className="leading-8 text-lg" style={{ color: '#C5EADB' }}>
            To help every African-owned business become easier to find, easier
            to support, and easier to grow — while helping customers discover the
            culture, products, food, and services they love.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What you can find on Markeetee
          </h2>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <span
                key={category}
                className="text-sm font-semibold px-4 py-2 rounded-full"
                style={{ background: '#E1F5EE', color: '#085041' }}
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center bg-white rounded-3xl border border-gray-100 p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Join the Markeetee community
          </h2>

          <p className="text-gray-500 mb-7 max-w-2xl mx-auto leading-7">
            Whether you are looking for businesses that feel like home or you own
            a business ready to reach more customers, Markeetee is built for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="inline-block text-sm font-semibold text-white px-6 py-3 rounded-xl"
              style={{ background: '#1D9E75' }}
            >
              Explore businesses
            </Link>

            <ListBusinessButton className="inline-block text-sm font-semibold px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:border-green-300 transition-colors" />
          </div>
        </div>
      </section>
    </main>
  )
}