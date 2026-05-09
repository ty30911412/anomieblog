'use client'

import { useEffect, useState, useRef } from 'react'
import { BookOpen, X } from 'lucide-react'

interface Props {
  slug: string
}

const STORAGE_KEY = (slug: string) => `reading_pos_${slug}`
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 天

interface SavedPos {
  scrollY: number
  percent: number
  savedAt: number
}

export default function ReadingMemory({ slug }: Props) {
  const [showBanner, setShowBanner] = useState(false)
  const [savedPos, setSavedPos] = useState<SavedPos | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // 讀取上次進度
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY(slug))
    if (!raw) return
    try {
      const pos: SavedPos = JSON.parse(raw)
      // 過期或進度太少（< 5%）就忽略
      if (Date.now() - pos.savedAt > EXPIRY_MS) { localStorage.removeItem(STORAGE_KEY(slug)); return }
      if (pos.percent < 5) return
      setSavedPos(pos)
      // 稍微延遲再顯示，讓頁面先載入完成
      setTimeout(() => setShowBanner(true), 800)
    } catch {
      localStorage.removeItem(STORAGE_KEY(slug))
    }
  }, [slug])

  // 即時儲存捲動進度（throttle 每 2 秒存一次）
  useEffect(() => {
    const handleScroll = () => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const scrollY = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const percent = docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0

        // 讀完（> 90%）就清除記憶
        if (percent >= 90) {
          localStorage.removeItem(STORAGE_KEY(slug))
          return
        }

        const pos: SavedPos = { scrollY, percent, savedAt: Date.now() }
        localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(pos))
      }, 2000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(saveTimer.current)
    }
  }, [slug])

  const handleContinue = () => {
    if (!savedPos) return
    window.scrollTo({ top: savedPos.scrollY, behavior: 'smooth' })
    setShowBanner(false)
    setDismissed(true)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
  }

  if (!showBanner || dismissed || !savedPos) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-amber-200 shadow-xl rounded-2xl px-4 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-ink-800">上次讀到 {savedPos.percent}%</p>
          <p className="text-[11px] text-ink-400">要繼續從這裡讀嗎？</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleContinue}
            className="px-3 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800 transition-colors"
          >
            繼續
          </button>
          <button onClick={handleDismiss} className="text-ink-300 hover:text-ink-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
