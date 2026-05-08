'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { BlogPost } from '@/types'
import { Edit, Trash2, Plus, FileText, LogOut } from 'lucide-react'
import AdminRoute from '@/components/AdminRoute'
import { AuthProvider } from '@/contexts/AuthContext'

function AdminDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
      setPosts(fetched)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleDelete = async (slug: string) => {
    if (!window.confirm('確定要刪除這篇文章嗎？此動作無法復原。')) return
    try {
      await deleteDoc(doc(db, 'posts', slug))
    } catch {
      alert('刪除失敗')
    }
  }

  const getStatus = (postDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    return postDate > today
      ? { text: '排程中', className: 'bg-amber-100 text-amber-800' }
      : { text: '已發布', className: 'bg-ink-100 text-ink-600' }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500 font-serif">載入中...</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pt-28">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink-900 mb-2">文章管理</h1>
          <p className="text-ink-500 font-sans">管理您的所有發布內容。</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2.5 border border-ink-200 text-ink-500 rounded-lg hover:bg-ink-50 transition-colors font-bold text-sm"
          >
            <LogOut size={16} /> 登出
          </button>
          <Link
            href="/admin/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#26221f] text-white rounded-lg hover:bg-[#36312d] transition-colors font-bold shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span>寫新文章</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-ink-100 border-dashed">
            <div className="inline-flex p-4 rounded-full bg-ink-50 text-ink-300 mb-4">
              <FileText size={48} />
            </div>
            <p className="text-ink-500 font-bold text-lg">目前沒有文章</p>
            <Link href="/admin/new" className="text-amber-700 font-bold hover:underline mt-2 inline-block">
              立即新增
            </Link>
          </div>
        ) : (
          posts.map((post) => {
            const status = getStatus(post.date)
            return (
              <div
                key={post.slug}
                className="group bg-white p-6 rounded-xl border border-ink-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-serif font-bold text-ink-900 mb-2 truncate group-hover:text-amber-800 transition-colors">
                    {post.title}
                  </h2>
                  <div className="flex items-center flex-wrap gap-3 text-sm font-sans">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${status.className}`}>
                      {status.text}
                    </span>
                    <span className="text-ink-400">{post.date}</span>
                    <span className="text-ink-400">{post.readTime}</span>
                    <div className="flex gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-ink-400 text-xs">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/post/${post.slug}`}
                    target="_blank"
                    className="text-xs text-ink-400 hover:text-ink-700 border border-ink-200 px-3 py-1.5 rounded transition-colors font-bold"
                  >
                    預覽
                  </Link>
                  <Link
                    href={`/admin/edit/${post.slug}`}
                    className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-900 border border-ink-200 hover:border-ink-400 px-3 py-1.5 rounded transition-colors font-bold"
                  >
                    <Edit size={14} /> 編輯
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded transition-colors font-bold"
                  >
                    <Trash2 size={14} /> 刪除
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    </AuthProvider>
  )
}
