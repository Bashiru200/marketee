import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Markeetee — African Businesses for the Diaspora',
  description: 'Discover African-owned businesses near you across the USA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Apply dark mode before React hydrates — prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              if (localStorage.getItem('markeetee-dark-mode') === 'true') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}