'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { List } from 'lucide-react'

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
  const [isExpanded, setIsExpanded] = useState(false)
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

  if (headings.length < 2) return null

  const activeIndex = headings.findIndex((h) => h.id === activeId)
  const progressText = activeIndex >= 0 ? `${activeIndex + 1} / ${headings.length}` : `0 / ${headings.length}`

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex items-stretch"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ────────────────────────────────────────
          文字清單面板
          展開：圓點先淡出(60ms)，之後 width + opacity 同步滑入(280ms)
          收起：width + opacity 同步縮退(300ms)，結束後圓點淡入(delay 200ms)
          關鍵：收起時兩者一起動，消除「瞬間消失再縮框」的違和感
      ──────────────────────────────────────── */}
      <div
        className="overflow-hidden shrink-0"
        style={{
          width: isExpanded ? '208px' : '0px',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: isExpanded
            // 展開：稍微延遲讓圓點先消失，再一起滑入
            ? 'width 300ms cubic-bezier(0.34,1.1,0.64,1) 70ms, opacity 240ms ease-out 70ms'
            // 收起：opacity 與 width 完全同步，用 ease-in 開頭讓收縮感更自然
            : 'width 300ms cubic-bezier(0.4,0,0.6,0) 0ms, opacity 300ms ease-in 0ms',
        }}
      >
        {/* 內容寬度固定，避免文字在 width 動畫時換行 */}
        <div className="w-[208px] bg-paper/85 backdrop-blur-md border border-ink-200/70 shadow-lg rounded-r-xl py-4 px-3">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
            <List size={11} /> 目錄
          </p>
          <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
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

      {/* ────────────────────────────────────────
          圓點進度標籤
          展開時：快速淡出 + 微微左移（70ms，在文字面板出現前消失）
          收起時：等文字面板縮完(~300ms)後再淡入滑回（delay 220ms）
          兩者 delay 互相呼應，保持「一進一出」節奏
      ──────────────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center gap-1.5 bg-paper/85 backdrop-blur-md border border-ink-200/70 shadow-lg rounded-r-xl cursor-pointer shrink-0"
        style={{
          padding: '14px 8px',
          opacity: isExpanded ? 0 : 1,
          transform: isExpanded ? 'translateX(-5px)' : 'translateX(0px)',
          pointerEvents: isExpanded ? 'none' : 'auto',
          transition: isExpanded
            // 展開時立刻消失，不擋文字面板
            ? 'opacity 80ms ease-in 0ms, transform 80ms ease-in 0ms'
            // 收起時等文字縮完再優雅滑入
            : 'opacity 220ms ease-out 220ms, transform 220ms cubic-bezier(0.34,1.1,0.64,1) 220ms',
        }}
      >
        {/* 章節進度點 */}
        <div className="flex flex-col gap-[5px]">
          {headings.map((h, i) => {
            const isActive = h.id === activeId
            const isPast = i < (activeIndex >= 0 ? activeIndex : 0)
            return (
              <div
                key={h.id}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  isActive ? '7px' : '5px',
                  height: isActive ? '7px' : '5px',
                  marginLeft: h.level > 1 ? '2px' : '0px',
                  backgroundColor: isActive
                    ? '#b45309'          // amber-700：目前章節
                    : isPast
                      ? '#8f887c'        // ink-400：已讀
                      : '#d1cdc5',       // ink-200：未讀
                  flexShrink: 0,
                }}
              />
            )
          })}
        </div>

        {/* x / total */}
        <span className="text-[9px] text-ink-400 font-mono leading-none mt-1">
          {progressText}
        </span>
      </div>
    </div>
  )
}
