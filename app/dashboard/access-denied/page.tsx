import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#FEF2F2' }}>
          <ShieldX size={28} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access restricted</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          The dashboard is only available to business owners. You're currently signed in as a customer.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/search"
            className="w-full text-center text-sm font-semibold text-white py-2.5 rounded-xl transition-colors"
            style={{ background: '#1D9E75' }}>
            Explore businesses
          </Link>
          <Link href="/auth/signup"
            className="w-full text-center text-sm font-medium text-gray-600 py-2.5 rounded-xl border border-gray-200 hover:border-green-300 transition-colors">
            Register a business instead
          </Link>
        </div>
      </div>
    </div>
  )
}