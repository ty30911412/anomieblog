'use client'

import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, deleteDoc, doc,
  query, orderBy, getDocs, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { Trash2, MessageSquare, LogOut, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react'
import AdminRoute from '@/components/AdminRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: Timestamp
}

interface PostComments {
  slug: string
  title: string
  comments: Comment[]
  expanded: boolean
}

function formatDate(ts: Timestamp) {
  return ts?.toDate?.().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) ?? '—'
}

function CommentsDashboard() {
  const [postComments, setPostComments] = useState<PostComments[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    // 先抓所有文章
    const unsubPosts = onSnapshot(
      query(collection(db, 'posts'), orderBy('date', 'desc')),
      async (snap) => {
        const results: PostComments[] = []
        for (const postDoc of snap.docs) {
          const commentsSnap = await getDocs(
            query(collection(db, 'posts', postDoc.id, 'comments'), orderBy('createdAt', 'desc'))
          )
          results.push({
            slug: postDoc.id,
            title: postDoc.data().title ?? postDoc.id,
            comments: commentsSnap.docs.map((c) => ({ id: c.id, ...c.data() } as Comment)),
            expanded: true,
          })
        }
        setPostComments(results)
        setLoading(false)
      }
    )
    return () => unsubPosts()
  }, [])

  const handleDelete = async (slug: string, commentId: string) => {
    if (!window.confirm('確定要刪除這則留言嗎？')) return
    setDeletingId(commentId)
    try {
      await deleteDoc(doc(db, 'posts', slug, 'comments', commentId))
      setPostComments((prev) =>
        prev.map((p) =>
          p.slug === slug
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
            : p
        )
      )
    } catch {
      alert('刪除失敗')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (slug: string) => {
    setPostComments((prev) =>
      prev.map((p) => p.slug === slug ? { ...p, expanded: !p.expanded } : p)
    )
  }

  const totalComments = postComments.reduce((acc, p) => acc + p.comments.length, 0)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500 font-serif">載入中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pt-28">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 mb-2">留言管理</h1>
          <p className="text-ink-500 font-sans">共 {totalComments} 則留言，橫跨 {postComments.filter(p => p.comments.length > 0).length} 篇文章。</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 border border-ink-200 text-ink-500 rounded-lg hover:bg-ink-50 transition-colors font-bold text-sm"
          >
            <LayoutDashboard size={16} /> 文章管理
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2.5 border border-ink-200 text-ink-500 rounded-lg hover:bg-ink-50 transition-colors font-bold text-sm"
          >
            <LogOut size={16} /> 登出
          </button>
        </div>
      </div>

      {/* 每篇文章的留言 */}
      <div className="space-y-4">
        {postComments.filter(p => p.comments.length > 0).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-ink-100 border-dashed">
            <MessageSquare size={40} className="mx-auto text-ink-200 mb-3" />
            <p className="text-ink-400 font-bold">目前還沒有任何留言</p>
          </div>
        ) : (
          postComments.map((p) => {
            if (p.comments.length === 0) return null
            return (
              <div key={p.slug} className="bg-white rounded-xl border border-ink-200 shadow-sm overflow-hidden">
                {/* 文章標題列 */}
                <button
                  onClick={() => toggleExpand(p.slug)}
                  className="w-full flex justify-between items-center px-6 py-4 hover:bg-ink-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-ink-900 text-lg">{p.title}</span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {p.comments.length} 則
                    </span>
                  </div>
                  {p.expanded ? <ChevronUp size={18} className="text-ink-400" /> : <ChevronDown size={18} className="text-ink-400" />}
                </button>

                {/* 留言列表 */}
                {p.expanded && (
                  <div className="divide-y divide-ink-100">
                    {p.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-4 px-6 py-4">
                        {/* 頭像 */}
                        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-amber-700 leading-none">
                            {c.name.trim().slice(0, 1).toUpperCase() || '?'}
                          </span>
                        </div>

                        {/* 內容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-bold text-ink-800">{c.name}</span>
                            <span className="text-[11px] text-ink-400 font-mono">{formatDate(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap break-words">
                            {c.content}
                          </p>
                        </div>

                        {/* 刪除按鈕 */}
                        <button
                          onClick={() => handleDelete(p.slug, c.id)}
                          disabled={deletingId === c.id}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded transition-colors font-bold shrink-0 disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                          {deletingId === c.id ? '刪除中...' : '刪除'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function CommentsAdminPage() {
  return (
    <AuthProvider>
      <AdminRoute>
        <CommentsDashboard />
      </AdminRoute>
    </AuthProvider>
  )
}
