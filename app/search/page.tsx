'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { BlogPost } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, Clock, Tag, X } from 'lucide-react'

export default function SearchPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      const snap = await getDocs(query(collection(db, 'posts'), orderBy('date', 'desc')))
      setPosts(snap.docs.map((d) => ({ id: d.id, slug: d.id, ...d.data() } as BlogPost)))
      setLoading(false)
    }
    fetchPosts()
  }, [])

  const results = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return posts
    return posts.filter((p) =>
      p.title?.toLowerCase().includes(kw) ||
      p.excerpt?.toLowerCase().includes(kw) ||
      p.content?.toLowerCase().includes(kw) ||
      p.tags?.some((t) => t.toLowerCase().includes(kw))
    )
  }, [keyword, posts])

  // 高亮關鍵字
  const highlight = (text: string) => {
    const kw = keyword.trim()
    if (!kw) return text
    const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</mark>
        : part
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pt-28 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-ink-900 mb-8">搜尋文章</h1>

      {/* 搜尋框 */}
      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          autoFocus
          placeholder="搜尋標題、內容、標籤..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full pl-11 pr-10 py-3.5 bg-white border border-ink-200 rounded-xl text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all shadow-sm text-sm"
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 結果狀態 */}
      {loading ? (
        <p className="text-center text-ink-400 py-20 font-serif">載入中...</p>
      ) : (
        <>
          <p className="text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-5">
            {keyword ? `找到 ${results.length} 篇相關文章` : `共 ${posts.length} 篇文章`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-20">
              <Search size={36} className="mx-auto text-ink-200 mb-3" />
              <p className="text-ink-400 font-serif">找不到符合「{keyword}」的文章</p>
              <p className="text-ink-300 text-sm mt-1">試試其他關鍵字或標籤</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((post) => (
                <Link
                  key={post.slug}
                  href={`/post/${post.slug}`}
                  className="group block bg-white rounded-xl border border-ink-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="flex gap-0">
                    {/* 封面縮圖 */}
                    {post.coverImage && (
                      <div className="w-28 sm:w-36 shrink-0 relative self-stretch min-h-[80px]">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="144px"
                        />
                      </div>
                    )}

                    {/* 內容 */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-center gap-3 text-[11px] text-ink-400 font-mono mb-1.5">
                        <span className="flex items-center gap-1"><Calendar size={10} />{post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                      </div>
                      <h2 className="font-serif font-bold text-ink-900 group-hover:text-amber-800 transition-colors mb-1 leading-snug line-clamp-2">
                        {highlight(post.title ?? '')}
                      </h2>
                      <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">
                        {highlight(post.excerpt ?? '')}
                      </p>
                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-0.5 text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                              <Tag size={9} />{highlight(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
