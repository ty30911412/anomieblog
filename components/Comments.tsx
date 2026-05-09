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

// ── 內嵌回覆表單 ──────────────────────────────────────
function ReplyForm({
  slug,
  replyTo,
  onClose,
}: {
  slug: string
  replyTo: { id: string; name: string }
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSent, setJustSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const lastKey = `comment_last_${slug}`
    const last = parseInt(localStorage.getItem(lastKey) || '0', 10)
    const now = Date.now()
    if (now - last < 60_000) {
      alert(`請稍候 ${Math.ceil((60_000 - (now - last)) / 1000)} 秒後再留言。`)
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts', slug, 'comments'), {
        name: name.trim() || '匿名讀者',
        content: content.trim(),
        createdAt: Timestamp.now(),
        replyTo,
      })
      localStorage.setItem(lastKey, String(Date.now()))
      setContent('')
      setJustSent(true)
      setTimeout(() => { setJustSent(false); onClose() }, 1500)
    } catch {
      alert('回覆送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ml-11 mt-3 bg-amber-50 border border-amber-200/60 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
          <CornerDownRight size={12} /> 回覆 {replyTo.name}
        </span>
        <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700">
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="暱稱（選填）"
        maxLength={30}
        className="w-full sm:w-48 px-3 py-1.5 bg-paper border border-ink-200 rounded-lg text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-600/25 focus:border-amber-500/60 transition-colors"
      />

      <div>
        <textarea
          rows={3}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`回覆 ${replyTo.name}...`}
          maxLength={500}
          className="w-full px-3 py-2 bg-paper border border-ink-200 rounded-lg text-sm text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-600/25 focus:border-amber-500/60 transition-colors resize-none leading-relaxed"
        />
        <p className="text-right text-[11px] text-ink-400 mt-0.5 font-mono">{content.length} / 500</p>
      </div>

      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800 active:scale-95 disabled:opacity-40 transition-all"
      >
        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {submitting ? '送出中...' : justSent ? '✓ 已送出！' : '送出回覆'}
      </button>
    </form>
  )
}

// ── 主元件 ────────────────────────────────────────────
export default function Comments({ slug }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const q = query(collection(db, 'posts', slug, 'comments'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    })
    return unsub
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const lastKey = `comment_last_${slug}`
    const last = parseInt(localStorage.getItem(lastKey) || '0', 10)
    const now = Date.now()
    if (now - last < 60_000) {
      alert(`請稍候 ${Math.ceil((60_000 - (now - last)) / 1000)} 秒後再留言。`)
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts', slug, 'comments'), {
        name: name.trim() || '匿名讀者',
        content: content.trim(),
        createdAt: Timestamp.now(),
      })
      localStorage.setItem(lastKey, String(Date.now()))
      setContent('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
    } catch {
      alert('留言送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const { roots, replies } = buildThreads(comments)

  return (
    <div className="space-y-10">

      {/* ── 主留言表單 ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-amber-100/70 border border-amber-300/50 rounded-xl p-6 space-y-4"
      >
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
          <p className="text-right text-[11px] text-ink-400 mt-1 font-mono">{content.length} / 1000</p>
        </div>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 text-white text-sm font-bold rounded-lg hover:bg-amber-800 active:scale-95 disabled:opacity-40 transition-all"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
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

          {roots.map((c) => (
            <div key={c.id}>
              {/* 父留言 */}
              <div className="flex gap-3.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200/70 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-amber-700 leading-none">{getInitials(c.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-bold text-ink-800">{c.name}</span>
                    <span className="text-[11px] text-ink-400 font-mono">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                  <button
                    onClick={() => setOpenReplyId(openReplyId === c.id ? null : c.id)}
                    className="mt-2 text-[11px] font-bold text-ink-400 hover:text-amber-700 transition-colors flex items-center gap-1"
                  >
                    <CornerDownRight size={11} />
                    {openReplyId === c.id ? '取消回覆' : '回覆'}
                  </button>
                </div>
              </div>

              {/* 內嵌回覆表單：緊接在父留言下方 */}
              {openReplyId === c.id && (
                <ReplyForm
                  slug={slug}
                  replyTo={{ id: c.id, name: c.name }}
                  onClose={() => setOpenReplyId(null)}
                />
              )}

              {/* 回覆列表 */}
              {(replies[c.id] || []).map((r) => (
                <div key={r.id} className="ml-11 mt-3 flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200/70 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-700 leading-none">{getInitials(r.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-ink-800">{r.name}</span>
                      <span className="text-[11px] text-ink-400 font-mono">{formatDate(r.createdAt)}</span>
                      <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
                        <CornerDownRight size={10} /> 回覆 {r.replyTo?.name}
                      </span>
                    </div>
                    <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap break-words">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
