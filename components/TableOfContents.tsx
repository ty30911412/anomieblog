'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { List, X } from 'lucide-react'

interface Heading {
  id: string
  text: string
  level: number
}

function parseHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n')
  const headings: Heading[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const text = match[2].replace(/\*\*|__|\*|_|`/g, '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w一-龥\s-]/g, '')
        .replace(/\s+/g, '-')
      headings.push({ id, text, level: match[1].length })
    }
  }
  return headings
}

interface Props {
  content: string
}

export default function TableOfContents({ content }: Props) {
  const headings = parseHeadings(content)
  const [activeId, setActiveId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)   // 桌機：hover 展開
  const [mobileOpen, setMobileOpen] = useState(false)   // 手機：點擊展開
  const isHovered = useRef(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout>>()

  const updateActiveId = useCallback(() => {
    const scrollY = window.scrollY + 140
    let current = ''
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el && el.offsetTop <= scrollY) current = h.id
    }
    setActiveId(current)
  }, [headings])

  useEffect(() => {
    const handleScroll = () => {
      updateActiveId()
      setIsExpanded(true)
      clearTimeout(collapseTimer.current)
      collapseTimer.current = setTimeout(() => {
        if (!isHovered.current) setIsExpanded(false)
      }, 2000)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    updateActiveId()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(collapseTimer.current)
    }
  }, [updateActiveId])

  const handleMouseEnter = () => {
    isHovered.current = true
    clearTimeout(collapseTimer.current)
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    isHovered.current = false
    collapseTimer.current = setTimeout(() => setIsExpanded(false), 600)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  if (headings.length < 2) return null

  const activeIndex = headings.findIndex((h) => h.id === activeId)
  const progressText = activeIndex >= 0 ? `${activeIndex + 1} / ${headings.length}` : `0 / ${headings.length}`

  return (
    <>
      {/* ══════════════════════════════════════
          桌機版：左側浮動（xl 以上）
      ══════════════════════════════════════ */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex items-stretch"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 文字清單面板 */}
        <div
          className="overflow-hidden shrink-0"
          style={{
            width: isExpanded ? '208px' : '0px',
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? 'auto' : 'none',
            transition: isExpanded
              ? 'width 300ms cubic-bezier(0.34,1.1,0.64,1) 70ms, opacity 240ms ease-out 70ms'
              : 'width 300ms cubic-bezier(0.4,0,0.6,0) 0ms, opacity 300ms ease-in 0ms',
          }}
        >
          <div className="w-[208px] bg-paper/85 backdrop-blur-md border border-ink-200/70 shadow-lg rounded-r-xl py-4 px-3">
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
              <List size={11} /> 目錄
            </p>
            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => { e.preventDefault(); scrollTo(h.id) }}
                  title={h.text}
                  className={`
                    block text-xs leading-relaxed py-1 border-l-2 rounded-r-sm
                    transition-colors duration-150 truncate
                    ${h.level === 2 ? 'pl-4' : h.level === 3 ? 'pl-6' : 'pl-2'}
                    ${activeId === h.id
                      ? 'border-amber-600 text-amber-800 font-bold bg-amber-50/60'
                      : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-ink-300 hover:bg-ink-50/50'
                    }
                  `}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* 圓點進度標籤 */}
        <div
          className="flex flex-col items-center justify-center gap-1.5 bg-paper/85 backdrop-blur-md border border-ink-200/70 shadow-lg rounded-r-xl cursor-pointer shrink-0"
          style={{
            padding: '14px 8px',
            opacity: isExpanded ? 0 : 1,
            transform: isExpanded ? 'translateX(-5px)' : 'translateX(0px)',
            pointerEvents: isExpanded ? 'none' : 'auto',
            transition: isExpanded
              ? 'opacity 80ms ease-in 0ms, transform 80ms ease-in 0ms'
              : 'opacity 220ms ease-out 220ms, transform 220ms cubic-bezier(0.34,1.1,0.64,1) 220ms',
          }}
        >
          <div className="flex flex-col gap-[5px]">
            {headings.map((h, i) => {
              const isActive = h.id === activeId
              const isPast = i < (activeIndex >= 0 ? activeIndex : 0)
              return (
                <div
                  key={h.id}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? '7px' : '5px',
                    height: isActive ? '7px' : '5px',
                    marginLeft: h.level > 1 ? '2px' : '0px',
                    backgroundColor: isActive ? '#b45309' : isPast ? '#8f887c' : '#d1cdc5',
                    flexShrink: 0,
                  }}
                />
              )
            })}
          </div>
          <span className="text-[9px] text-ink-400 font-mono leading-none mt-1">{progressText}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          手機版：底部浮動按鈕 + 抽屜
      ══════════════════════════════════════ */}
      <div className="xl:hidden">
        {/* 浮動觸發按鈕（左下角，避開回到頂端按鈕） */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="開啟目錄"
          className="fixed bottom-6 left-4 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white border border-ink-200 shadow-lg rounded-full text-ink-600 text-xs font-bold hover:border-amber-300 hover:text-amber-700 transition-all"
        >
          <List size={15} />
          <span>目錄</span>
          <span className="text-ink-400 font-mono">{progressText}</span>
        </button>

        {/* 遮罩 */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* 抽屜（從底部滑上來） */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-paper rounded-t-2xl shadow-2xl border-t border-ink-200 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <span className="font-serif font-bold text-ink-900 flex items-center gap-2">
              <List size={16} /> 文章目錄
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-full hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="px-4 py-3 space-y-0.5 max-h-[60vh] overflow-y-auto pb-8">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`
                  w-full text-left text-sm leading-relaxed py-2.5 px-3 border-l-2 rounded-r-lg
                  transition-colors duration-150
                  ${h.level === 3 ? 'ml-4' : ''}
                  ${activeId === h.id
                    ? 'border-amber-600 text-amber-800 font-bold bg-amber-50'
                    : 'border-transparent text-ink-600 hover:text-ink-900 hover:bg-ink-50 hover:border-ink-300'
                  }
                `}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
