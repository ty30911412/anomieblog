import React from 'react'
import Link from 'next/link'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-ink-200/60 mt-24 py-12 bg-ink-50/30">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-sans text-ink-400">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif font-bold text-ink-700 text-lg">Liam's note</span>
          <span>讀書筆記與科普知識分享。</span>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-ink-700 transition-colors">文章列表</Link>
          <Link href="/about" className="hover:text-ink-700 transition-colors">關於我</Link>
        </nav>

        <p className="text-ink-300">
          © {currentYear} Liam's note. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
