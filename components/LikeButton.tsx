'use client'

import { useState, useEffect } from 'react'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ThumbsUp } from 'lucide-react'

interface LikeButtonProps {
  slug: string
  initialLikes: number
}

export default function LikeButton({ slug, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)

  useEffect(() => {
    const liked = localStorage.getItem(`liked_${slug}`)
    if (liked === 'true') setHasLiked(true)
  }, [slug])

  const handleLike = async () => {
    if (hasLiked) return
    const newLikes = likes + 1
    setLikes(newLikes)
    setHasLiked(true)
    localStorage.setItem(`liked_${slug}`, 'true')
    try {
      await updateDoc(doc(db, 'posts', slug), { likes: increment(1) })
    } catch {
      // 靜默失敗
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
