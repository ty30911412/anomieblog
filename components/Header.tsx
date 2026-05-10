'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Search, BarChart2 } from 'lucide-react'
import { AuthProvider } from '@/contexts/AuthContext'

const HeaderInner: React.FC = () => {
  const pathname = usePathname()
  const { currentUser } = useAuth()
  const isPostPage = pathname?.startsWith('/post/')
  const [isScrolled, setIsScrolled] = useState(false)
  const transparentMode = isPostPage ?? false

  useEffect(() => {
    const handleScroll = () => {
      const threshold = transparentMode ? window.innerHeight * 0.6 : 20
      setIsScrolled(window.scrollY > threshold)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [transparentMode])

  const isTransparentState = transparentMode && !isScrolled

  const getNavLinkStyle = (path: string, isBordered = false) => {
    const isCurrent = pathname === path
    const base = 'flex items-center justify-center px-4 py-2 rounded-lg text-sm font-sans tracking-wide transition-all duration-300 font-bold border gap-2'

    let color = isTransparentState ? 'text-white border-white' : 'text-ink-900 border-ink-900'
    if (!isScrolled && !isTransparentState && !isBordered) {
      color = 'text-ink-500 hover:text-ink-900 border-transparent'
    }

    let hover = ''
    if (isTransparentState) {
      hover = isBordered ? 'border-white/70 hover:bg-white/20 hover:border-white' : 'hover:bg-white/20 border-transparent'
    } else if (isScrolled) {
      hover = isBordered ? 'border-ink-900 hover:bg-ink-100' : 'hover:bg-ink-100 border-transparent'
    } else {
      hover = isBordered ? 'border-transparent text-amber-700 hover:text-amber-900 hover:bg-amber-50' : 'hover:bg-amber-50/50 border-transparent'
    }

    const current = isCurrent && !isBordered
      ? isTransparentState ? 'bg-white/20' : (isScrolled ? 'bg-ink-50' : 'bg-amber-50/50 text-ink-900')
      : ''

    return `${base} ${color} ${hover} ${current}`
  }

  return (
    <header
      className={`
        fixed top-0 z-40 w-full transition-all duration-500 ease-in-out border-b
        ${isScrolled
          ? 'bg-paper/90 backdrop-blur-md border-ink-200 shadow-sm py-3'
          : isTransparentState
            ? 'bg-transparent border-transparent py-6'
            : 'bg-paper/0 border-transparent py-6'
        }
      `}
    >
      <div className="w-full px-6 md:px-8 flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-0 items-start">
        <Link
          href="/"
          className={`
            font-serif font-bold tracking-tight transition-all duration-500
            ${isScrolled ? 'text-2xl' : 'text-3xl'}
            ${isTransparentState ? 'text-white' : isScrolled ? 'text-amber-800' : 'text-ink-900'}
          `}
        >
          Liam's note
        </Link>

        <nav className="flex items-center gap-2 self-start md:self-auto">
          {isPostPage ? (
            <Link href="/" className={getNavLinkStyle('/', true)}>
              <ArrowLeft size={16} /> <span>返回列表</span>
            </Link>
          ) : (
            <Link href="/" className={getNavLinkStyle('/', true)}>文章列表</Link>
          )}

          <Link href="/about" className={getNavLinkStyle('/about', true)}>關於我</Link>

          <Link
            href="/election"
            className={`${getNavLinkStyle('/election', true)} gap-1.5`}
            title="2026 選舉民調追蹤"
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">選舉</span>
          </Link>

          <Link href="/search" className={getNavLinkStyle('/search')} aria-label="搜尋">
            <Search size={15} />
          </Link>

          {currentUser && (
            <Link href="/admin" className={getNavLinkStyle('/admin', true)}>管理後台</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

// Header 在 layout.tsx（Server Component）中使用，需在此包裹 AuthProvider
const Header: React.FC = () => (
  <AuthProvider>
    <HeaderInner />
  </AuthProvider>
)

export default Header
