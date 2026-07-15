// app/coming-soon/layout.tsx
// Server component — handles metadata so the client page doesn't have to
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon | Markeetee',
  robots: { index: false, follow: false },
}

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}