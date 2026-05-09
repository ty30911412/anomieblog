import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock } from 'lucide-react'
import { BlogPost } from '@/types'

interface Props {
  posts: Pick<BlogPost, 'slug' | 'title' | 'excerpt' | 'coverImage' | 'date' | 'readTime' | 'tags'>[]
}

export default function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null

  return (
    <div className="mt-16 pt-10 border-t border-ink-200/60">
      <h2 className="font-serif text-xl font-bold text-ink-900 mb-6">你可能也喜歡</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/post/${post.slug}`}
            className="group bg-white rounded-xl border border-ink-200 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all duration-200"
          >
            {/* 封面圖 */}
            {post.coverImage && (
              <div className="h-36 overflow-hidden relative">
                <Image
                  src={post.coverImage}
                  alt={post.title ?? ''}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}

            {/* 內容 */}
            <div className="p-4">
              <div className="flex items-center gap-3 text-[11px] text-ink-400 font-mono mb-2">
                <span className="flex items-center gap-1"><Calendar size={11} />{post.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{post.readTime}</span>
              </div>
              <h3 className="font-serif font-bold text-ink-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors mb-1.5">
                {post.title}
              </h3>
              <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
