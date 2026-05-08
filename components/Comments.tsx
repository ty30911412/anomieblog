'use client'

import { useEffect, useState } from 'react'
import {
  collection, addDoc, query, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: Timestamp
}

interface Props {
  slug: string
}

function getInitials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function formatDate(ts: Timestamp) {
  return ts.toDate().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Comments({ slug }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSent, setJustSent] = useState(false)

  useEffect(() => {
    if (!slug) return
    const q = query(
      collection(db, 'posts', slug, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    })
    return unsub
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts', slug, 'comments'), {
        name: name.trim() || '匿名讀者',
        content: content.trim(),
        createdAt: Timestamp.now(),
      })
      setContent('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
    } catch {
      alert('留言送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* ── 留言表單 ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-amber-100/70 border border-amber-300/50 rounded-xl p-6 space-y-4"
      >
        {/* 暱稱 */}
        <div>
          <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5">
            暱稱（選填）
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="匿名讀者"
            maxLength={30}
            className="w-full sm:w-56 px-3 py-2 bg-paper border border-ink-200 rounded-lg text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-600/25 focus:border-amber-500/60 transition-colors"
          />
        </div>

        {/* 留言內容 */}
        <div>
          <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5">
            留言
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="寫下你的想法、提問或回饋..."
            maxLength={1000}
            className="w-full px-3 py-2 bg-paper border border-ink-200 rounded-lg text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-600/25 focus:border-amber-500/60 transition-colors resize-none leading-relaxed"
          />
          <p className="text-right text-[11px] text-ink-400 mt-1 font-mono">
            {content.length} / 1000
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 text-white text-sm font-bold rounded-lg hover:bg-amber-800 active:scale-95 disabled:opacity-40 transition-all"
        >
          {submitting
            ? <Loader2 size={14} className="animate-spin" />
            : <Send size={14} />}
          {submitting ? '送出中...' : justSent ? '✓ 已送出！' : '送出留言'}
        </button>
      </form>

      {/* ── 留言列表 ── */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-ink-300 select-none">
          <MessageSquare size={28} className="opacity-30" />
          <p className="text-sm">還沒有留言，成為第一個留言的人吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest">
            {comments.length} 則留言
          </p>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3.5">
              {/* 頭像 */}
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200/70 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-amber-700 leading-none">
                  {getInitials(c.name)}
                </span>
              </div>

              {/* 內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-sm font-bold text-ink-800">{c.name}</span>
                  <span className="text-[11px] text-ink-400 font-mono">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
