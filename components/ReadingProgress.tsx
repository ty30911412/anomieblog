'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
      setShowTop(scrollTop > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* 頂端進度條 */}
      <div className="fixed top-0 left-0 z-50 h-0.5 w-full bg-ink-100/60">
        <div
          className="h-full bg-amber-600 transition-all duration-75 ease-linear origin-left"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 回到頂端浮動按鈕 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="回到頂端"
        className={`
          fixed bottom-8 right-8 z-50 p-3 rounded-full
          bg-white border border-ink-200 shadow-lg
          text-ink-500 hover:text-ink-900 hover:border-ink-400 hover:shadow-xl
          transition-all duration-300
          ${showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <ArrowUp size={18} />
      </button>
    </>
  )
}
