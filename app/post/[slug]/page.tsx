import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Calendar, Clock, Tag } from 'lucide-react'
import { BlogPost } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import LikeButton from '@/components/LikeButton'
import Comments from '@/components/Comments'
import ReadingProgress from '@/components/ReadingProgress'
import ReadingMemory from '@/components/ReadingMemory'
import TableOfContents from '@/components/TableOfContents'
import ShareButtons from '@/components/ShareButtons'
import ImageLightbox from '@/components/ImageLightbox'
import RelatedPosts from '@/components/RelatedPosts'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  if (!adminDb) return null
  const docSnap = await adminDb.collection('posts').doc(slug).get()
  if (!docSnap.exists) return null
  const data = docSnap.data() as Omit<BlogPost, 'id' | 'slug'>
  return { id: docSnap.id, slug: docSnap.id, ...data }
}

async function getRelatedPosts(currentSlug: string, tags: string[]) {
  if (!adminDb || tags.length === 0) return []
  const snap = await adminDb.collection('posts').get()
  const scored = snap.docs
    .filter((d) => d.id !== currentSlug)
    .map((d) => {
      const { slug: _s, ...data } = d.data() as BlogPost
      const overlap = (data.tags || []).filter((t) => tags.includes(t)).length
      return { slug: d.id, ...data, overlap }
    })
    .filter((p) => p.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.date?.localeCompare(a.date ?? '') )
    .slice(0, 3)
  return scored.map(({ overlap: _o, ...rest }) => rest)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: '文章不存在' }
  const ogImage = `/api/og?title=${encodeURIComponent(post.title)}&excerpt=${encodeURIComponent(post.excerpt ?? '')}`
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liam-note.vercel.app'

export default async function PostPage({ params }: Props) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(params.slug, post.tags ?? [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: `${post.date}T00:00:00+08:00`,
    dateModified: `${post.date}T00:00:00+08:00`,
    author: {
      '@type': 'Person',
      name: 'Liam',
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: "Liam's note",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/post/${post.slug}`,
    },
    keywords: post.tags?.join(', '),
    inLanguage: 'zh-TW',
  }

  return (
    <article className="overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <ReadingMemory slug={post.slug} />

      {/* Hero */}
      <div className="relative h-[65vh] min-h-[400px] w-[100vw] left-1/2 -translate-x-1/2 flex items-center justify-center overflow-hidden">
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            className="object-cover z-0"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-ink-900/40 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center text-white flex flex-col items-center">
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-sans mb-6 opacity-90 tracking-wider uppercase">
            <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{post.date}</span></div>
            <div className="flex items-center gap-1.5"><Clock size={14} /><span>{post.readTime}</span></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tight drop-shadow-sm">
            {post.title}
          </h1>
        </div>
      </div>

      <TableOfContents content={post.content} />

      <div className="xl:pl-20">
        <div className="max-w-3xl mx-auto px-6 mt-16 md:mt-24 pb-20 md:pb-32">
          <ImageLightbox>
            <MarkdownRenderer content={post.content} />
          </ImageLightbox>

          {/* 標籤 + 喜歡 + 分享 */}
          <div className="border-t border-ink-200/60 pt-10 mt-16 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 bg-ink-100 text-ink-600 rounded-full text-xs font-bold hover:bg-ink-200 transition-colors cursor-default"
                  >
                    <Tag size={12} />{tag}
                  </span>
                ))}
              </div>
              <LikeButton slug={post.slug} initialLikes={post.initialLikes ?? 0} />
            </div>
            <ShareButtons title={post.title} />
          </div>

          {/* 相關文章 */}
          <RelatedPosts posts={relatedPosts} />

          {/* 留言 */}
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-ink-900 mb-6">留言討論</h2>
            <Comments slug={post.slug} />
          </div>
        </div>
      </div>
    </article>
  )
}
