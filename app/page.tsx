import { adminDb } from '@/lib/firebase-admin'
import { BlogPost } from '@/types'
import NewsletterForm from '@/components/NewsletterForm'
import HomePostGrid from '@/components/HomePostGrid'

export const revalidate = 60

async function getPosts(): Promise<BlogPost[]> {
  if (!adminDb) return []
  const snapshot = await adminDb.collection('posts').orderBy('date', 'desc').get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<BlogPost, 'id'>),
  }))
}

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-20 animate-fade-in">
      {/* 引言 */}
      <div className="prose prose-stone max-w-3xl pt-16">
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-ink-700 italic opacity-80">
          「Economics is all about how people make choices; sociology is all about why they don&apos;t have any choices to make.」
        </p>
      </div>

      {/* 文章列表（含 tag 篩選） */}
      {posts.length > 0 ? (
        <HomePostGrid posts={posts} />
      ) : (
        <div className="text-center py-20">
          <p className="text-ink-400 font-serif">目前還沒有文章，請至後台新增。</p>
        </div>
      )}

      {/* 電子報 */}
      <div className="w-full h-px bg-ink-200/60" />
      <NewsletterForm />
    </div>
  )
}
