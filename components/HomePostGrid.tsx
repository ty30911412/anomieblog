'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, X, ChevronDown, ChevronUp } from 'lucide-react'
import { BlogPost } from '@/types'

const TAG_VISIBLE_COUNT = 10

// 正規化標籤：統一繁體字形（台→臺 等常見異體字）
function normalizeTag(tag: string): string {
  return tag.replace(/台灣/g, '臺灣').replace(/台北/g, '臺北').replace(/台南/g, '臺南').replace(/台中/g, '臺中').replace(/台東/g, '臺東')
}

interface Props {
  posts: BlogPost[]
}

export default function HomePostGrid({ posts }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [tagsExpanded, setTagsExpanded] = useState(false)

  // 收集所有 tag，正規化後去重，依出現次數排序
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {}
    posts.forEach((p) => p.tags.forEach((t) => {
      const normalized = normalizeTag(t)
      counts[normalized] = (counts[normalized] ?? 0) + 1
    }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t)
  }, [posts])

  const visibleTags = tagsExpanded ? allTags : allTags.slice(0, TAG_VISIBLE_COUNT)
  const hasMore = allTags.length > TAG_VISIBLE_COUNT

  const filtered = activeTag ? posts.filter((p) => p.tags.some((t) => normalizeTag(t) === activeTag)) : posts
  const [featuredPost, ...recentPosts] = filtered

  return (
    <div className="space-y-20">
      {/* 標籤篩選列 */}
      {allTags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-widest mr-1">篩選</span>
            {visibleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                  ${activeTag === tag
                    ? 'bg-ink-900 text-paper shadow-sm'
                    : 'bg-ink-100/70 text-ink-500 hover:bg-ink-200 hover:text-ink-800'
                  }
                `}
              >
                #{tag}
                {activeTag === tag && <X size={10} className="ml-0.5" />}
              </button>
            ))}
            {hasMore && (
              <button
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-ink-400 hover:text-ink-700 hover:bg-ink-100/70 transition-all duration-200 border border-dashed border-ink-200 hover:border-ink-400"
              >
                {tagsExpanded ? (
                  <><ChevronUp size={11} />收起</>
                ) : (
                  <><ChevronDown size={11} />還有 {allTags.length - TAG_VISIBLE_COUNT} 個</>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 特色文章 Hero（篩選時隱藏，顯示所有文章 grid） */}
      {!activeTag && featuredPost && (
        <section className="group relative grid grid-cols-1 lg:grid-cols-12 lg:gap-0 gap-8 items-center">
          <Link
            href={`/post/${featuredPost.slug}`}
            className="lg:col-start-1 lg:col-end-10 lg:row-start-1 w-full h-full overflow-hidden rounded-2xl block relative aspect-[16/9] lg:aspect-[16/10] shadow-md z-10"
          >
            <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-colors duration-500 z-10" />
            <Image
              src={featuredPost.coverImage}
              alt={featuredPost.title}
              fill
              priority
              className="object-cover transform transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 75vw"
            />
          </Link>
          <div className="lg:col-start-8 lg:col-end-13 lg:row-start-1 flex flex-col justify-center space-y-6 lg:p-12 p-6 rounded-2xl z-20 transition-all duration-700 ease-out lg:group-hover:-translate-x-4 bg-white/80 group-hover:bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl shadow-ink-900/10">
            <div className="flex items-center gap-3 text-sm font-sans text-ink-600 font-medium group-hover:text-amber-700 transition-colors">
              <span>{featuredPost.date}</span>
              <span className="w-1 h-1 bg-ink-400 rounded-full" />
              <span>{featuredPost.readTime}</span>
            </div>
            <Link href={`/post/${featuredPost.slug}`} className="block space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 leading-tight group-hover:text-amber-900 transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-ink-600 font-serif leading-relaxed text-lg line-clamp-4 group-hover:text-ink-900 transition-colors">
                {featuredPost.excerpt}
              </p>
            </Link>
            <div className="pt-4 flex items-center gap-3 flex-wrap">
              {featuredPost.tags.map((tag) => (
                <span key={tag} className="text-xs font-sans text-ink-600 bg-white/50 border border-white/40 px-3 py-1.5 rounded-md hover:bg-white cursor-default transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 分隔線 */}
      {!activeTag && <div className="w-full h-px bg-ink-200/60" />}

      {/* 文章 Grid */}
      {filtered.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {(activeTag ? filtered : recentPosts).map((post) => (
            <article key={post.id} className="group flex flex-col space-y-5">
              <Link href={`/post/${post.slug}`} className="block overflow-hidden rounded-xl aspect-[4/3] relative shadow-sm border border-ink-100/50">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10" />
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transform transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </Link>
              <div className="space-y-3 transition-transform duration-500 group-hover:translate-x-2">
                <div className="flex items-center gap-3 text-xs font-sans text-ink-400 font-medium group-hover:text-amber-700 transition-colors">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 bg-ink-300 rounded-full" />
                  <span className="flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
                </div>
                <Link href={`/post/${post.slug}`} className="block space-y-2">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-ink-900 leading-snug group-hover:text-amber-800 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-ink-400 font-serif leading-relaxed text-sm line-clamp-3 group-hover:text-ink-700 transition-colors">
                    {post.excerpt}
                  </p>
                </Link>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {post.tags.slice(0, 2).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(normalizeTag(tag))}
                        className="text-xs font-sans text-ink-400 bg-ink-100/50 px-2 py-1 rounded hover:bg-ink-200 hover:text-ink-700 transition-colors"
                      >
                        #{normalizeTag(tag)}
                      </button>
                    ))}
                  </div>
                  <Link href={`/post/${post.slug}`} className="text-ink-300 hover:text-ink-800 transition-colors">
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="text-center py-16">
          <p className="text-ink-400 font-serif">沒有符合 <span className="font-bold text-ink-600">#{activeTag}</span> 的文章。</p>
          <button onClick={() => setActiveTag(null)} className="mt-3 text-amber-700 font-bold text-sm hover:underline">
            顯示所有文章
          </button>
        </div>
      )}
    </div>
  )
}
