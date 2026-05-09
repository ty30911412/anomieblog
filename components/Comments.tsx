'use client'

import { useEffect, useState } from 'react'
import {
  collection, addDoc, query, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MessageSquare, Send, Loader2, CornerDownRight, X } from 'lucide-react'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: Timestamp
  replyTo?: { id: string; name: string } | null
}

interface Props {
  slug: string
}

function getInitials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function formatDate(ts: Timestamp) {
  return ts?.toDate?.().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) ?? ''
}

// 將留言組織成父 → 子結構
function buildThreads(comments: Comment[]) {
  const roots: Comment[] = []
  const replies: Record<string, Comment[]> = {}

  for (const c of comments) {
    if (c.replyTo?.id) {
      if (!replies[c.replyTo.id]) replies[c.replyTo.id] = []
      replies[c.replyTo.id].push(c)
    } else {
      roots.push(c)
    }
  }
  return { roots, replies }
}

export default function Comments({ slug }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)

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

    // 防濫發：60 秒內只能送一則
    const lastKey = `comment_last_${slug}`
    const last = parseInt(localStorage.getItem(lastKey) || '0', 10)
    const now = Date.now()
    if (now - last < 60_000) {
      const wait = Math.ceil((60_000 - (now - last)) / 1000)
      alert(`請稍候 ${wait} 秒後再留言。`)
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts', slug, 'comments'), {
        name: name.trim() || '匿名讀者',
        content: content.trim(),
        createdAt: Timestamp.now(),
        ...(replyingTo ? { replyTo: replyingTo } : {}),
      })
      localStorage.setItem(lastKey, String(Date.now()))
      setContent('')
      setReplyingTo(null)
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
    } catch {
      alert('留言送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const { roots, replies } = buildThreads(comments)
  const totalCount = comments.length

  const CommentCard = ({ c, isReply = false }: { c: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : ''}`}>
      {/* 頭像 */}
      <div className={`rounded-full bg-amber-100 border border-amber-200/70 flex items-center justify-center shrink-0 mt-0.5 ${isReply ? 'w-7 h-7' : 'w-8 h-8'}`}>
        <span className={`font-bold text-amber-700 leading-none ${isReply ? 'text-xs' : 'text-sm'}`}>
          {getInitials(c.name)}
        </span>
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-bold text-ink-800">{c.name}</span>
          <span className="text-[11px] text-ink-400 font-mono">{formatDate(c.createdAt)}</span>
          {isReply && c.replyTo && (
            <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
              <CornerDownRight size={10} />
              回覆 {c.replyTo.name}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap break-words">
          {c.content}
        </p>
        {/* 回覆按鈕 */}
        {!isReply && (
          <button
            onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, name: c.name })}
            className="mt-2 text-[11px] font-bold text-ink-400 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            <CornerDownRight size={11} />
            {replyingTo?.id === c.id ? '取消回覆' : '回覆'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-10">

      {/* ── 留言表單 ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-amber-100/70 border border-amber-300/50 rounded-xl p-6 space-y-4"
      >
        {/* 回覆提示 */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-amber-200/60 rounded-lg px-3 py-2 text-sm">
            <span className="text-amber-800 font-bold flex items-center gap-1.5">
              <CornerDownRight size={14} />
              正在回覆 {replyingTo.name}
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-amber-600 hover:text-amber-900"
            >
              <X size={14} />
            </button>
          </div>
        )}

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
            {replyingTo ? `回覆 ${replyingTo.name}` : '留言'}
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyingTo ? `回覆 ${replyingTo.name}...` : '寫下你的想法、提問或回饋...'}
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
          {submitting ? '送出中...' : justSent ? '✓ 已送出！' : replyingTo ? '送出回覆' : '送出留言'}
        </button>
      </form>

      {/* ── 留言列表 ── */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-ink-300 select-none">
          <MessageSquare size={28} className="opacity-30" />
          <p className="text-sm">還沒有留言，成為第一個留言的人吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest">
            {totalCount} 則留言
          </p>
          {roots.map((c) => (
            <div key={c.id}>
              <CommentCard c={c} />
              {/* 回覆 */}
              {(replies[c.id] || []).map((r) => (
                <CommentCard key={r.id} c={r} isReply />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
