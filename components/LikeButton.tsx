'use client'

import { useState, useEffect } from 'react'
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ThumbsUp } from 'lucide-react'

interface LikeButtonProps {
  slug: string
  initialLikes: number
}

export default function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)

  // 從 localStorage 還原按讚狀態
  useEffect(() => {
    if (localStorage.getItem(`liked_${slug}`) === 'true') setHasLiked(true)
  }, [slug])

  // 即時監聽 Firestore 的真實按讚數
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'posts', slug), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setLikes(data.likes ?? data.initialLikes ?? initialLikes)
      }
    })
    return unsub
  }, [slug, initialLikes])

  const handleLike = async () => {
    if (hasLiked) return
    setHasLiked(true) // 樂觀 UI
    try {
      await updateDoc(doc(db, 'posts', slug), { likes: increment(1) })
      localStorage.setItem(`liked_${slug}`, 'true') // 確認寫入成功後才儲存
    } catch {
      setHasLiked(false) // 失敗則回滾
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={hasLiked}
      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-bold shadow-sm hover:shadow-md ${
        hasLiked
          ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default'
          : 'bg-white text-ink-600 border border-ink-200 hover:border-amber-300 hover:text-amber-600'
      }`}
    >
      <ThumbsUp size={18} className={hasLiked ? 'fill-current' : ''} />
      <span>{hasLiked ? '已喜歡' : '喜歡這篇文章'}</span>
      <span className="ml-1 opacity-80">({likes})</span>
    </button>
  )
}
