'use client'

import { useEffect, useState } from 'react'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Eye } from 'lucide-react'

interface Props {
  slug: string
  initialViews?: number
  className?: string
}

export default function ViewCounter({ slug, initialViews = 0, className = '' }: Props) {
  const [views, setViews] = useState(initialViews)

  useEffect(() => {
    // 同一 session 內只計一次，避免重新整理就一直加
    const key = `viewed_${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, 'true')

    const ref = doc(db, 'posts', slug)
    updateDoc(ref, { views: increment(1) })
      .then(() => setViews((v) => v + 1))
      .catch(() => {}) // 靜默失敗，不影響使用者體驗
  }, [slug])

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <Eye size={12} />
      {views.toLocaleString()}
    </span>
  )
}
