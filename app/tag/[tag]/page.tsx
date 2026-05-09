import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BlogPost } from '@/types'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

export const revalidate = 60

interface Props {
  params: { tag: string }
}

async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  if (!adminDb) return []
  const snap = await adminDb
    .collection('posts')
    .where('tags', 'array-contains', tag)
    .orderBy('date', 'desc')
    .get()
  return snap.docs.map((d) => ({ id: d.id, slug: d.id, ...d.data() } as BlogPost))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag)
  return {
    title: `#${tag}`,
    description: `所有關於「${tag}」的文章`,
    openGraph: {
      title: `#${tag} — Liam's note`,
      description: `所有關於「${tag}」的文章`,
    },
  }
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag)
  const posts = await getPostsByTag(tag)

  if (posts.length === 0) notFound()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pt-28 min-h-screen">
      {/* Header */}
      <div className="mb-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-8"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl text-ink-200 select-none">#</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900">{tag}</h1>
        </div>
        <p className="text-ink-400 mt-3 text-sm tracking-wide">
          共 <span className="font-bold text-ink-600">{posts.length}</span> 篇文章
        </p>
      </div>

      {/* Post Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
        {posts.map((post) => (
          <article key={post.id} className="group flex flex-col space-y-5">
            <Link
              href={`/post/${post.slug}`}
              className="block overflow-hidden rounded-xl aspect-[4/3] relative shadow-sm border border-ink-100/50"
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 z-10" />
              {post.coverImage && (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transform transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </Link>

            <div className="space-y-3 transition-transform duration-500 group-hover:translate-x-2">
              <div className="flex items-center gap-3 text-xs font-sans text-ink-400 font-medium group-hover:text-amber-700 transition-colors">
                <span className="flex items-center gap-1"><Calendar size={10} />{post.date}</span>
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

              <div className="flex gap-2 flex-wrap pt-1">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/tag/${encodeURIComponent(t)}`}
                    className={`text-xs font-sans px-2.5 py-1 rounded-md transition-colors ${
                      t === tag
                        ? 'bg-ink-900 text-paper'
                        : 'text-ink-400 bg-ink-100/50 hover:bg-ink-200 hover:text-ink-700'
                    }`}
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
