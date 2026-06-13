import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const message = searchParams.message ?? 'unknown_error'

  const messages: Record<string, { title: string; desc: string }> = {
    confirmation_failed: {
      title: 'Confirmation failed',
      desc:  'Your email confirmation link may have expired. Please request a new one.',
    },
    unknown_error: {
      title: 'Something went wrong',
      desc:  'An unexpected error occurred. Please try again.',
    },
  }

  const content = messages[message] ?? messages.unknown_error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 bg-red-50">
          <AlertCircle size={26} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{content.title}</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">{content.desc}</p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/signup"
            className="w-full py-2.5 text-white rounded-xl text-sm font-semibold text-center"
            style={{ background: '#1D9E75' }}>
            Sign up again
          </Link>
          <Link href="/auth/login"
            className="w-full py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}