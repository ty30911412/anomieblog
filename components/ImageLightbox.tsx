'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export default function ImageLightbox({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG' && target.dataset.lightbox === 'true') {
        const img = target as HTMLImageElement
        setLightbox({ src: img.src, alt: img.alt || '' })
        setZoomed(false)
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [])

  // ESC 關閉
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 打開時鎖定 body scroll
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  return (
    <>
      <div ref={containerRef}>{children}</div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          {/* 關閉 */}
          <button
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={22} />
          </button>

          {/* 縮放切換 */}
          <button
            className="absolute bottom-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
          >
            {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
          </button>

          <img
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
            className={`max-h-[90vh] rounded-xl shadow-2xl transition-all duration-300 cursor-zoom-in select-none ${
              zoomed ? 'max-w-none w-auto scale-150 cursor-zoom-out' : 'max-w-[90vw] object-contain'
            }`}
          />

          {lightbox.alt && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center max-w-md">
              {lightbox.alt}
            </p>
          )}
        </div>
      )}
    </>
  )
}
