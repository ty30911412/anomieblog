import type { Metadata } from 'next'
import { Inter, Noto_Serif_TC } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-noto-serif-tc',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anomieblog.vercel.app'

export const metadata: Metadata = {
  title: {
    default: "Liam's note",
    template: "%s｜Liam's note",
  },
  description: '讀書筆記與科普知識分享，涵蓋社會學、文化、人文科學等主題。',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: "Liam's note",
    url: SITE_URL,
  },
  alternates: {
    types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${notoSerifTC.variable}`}>
      <body className="min-h-screen bg-paper text-ink-800 font-sans">
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
