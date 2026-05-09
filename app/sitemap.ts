import { MetadataRoute } from 'next'
import { adminDb } from '@/lib/firebase-admin'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anomieblog.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  if (!adminDb) return staticPages

  const snap = await adminDb.collection('posts').orderBy('date', 'desc').get()

  const postPages: MetadataRoute.Sitemap = snap.docs.map((doc) => ({
    url: `${SITE_URL}/post/${doc.id}`,
    lastModified: new Date(doc.data().date as string),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 收集所有不重複的 tag
  const allTags = new Set<string>()
  snap.docs.forEach((doc) => {
    const tags: string[] = doc.data().tags ?? []
    tags.forEach((t) => allTags.add(t))
  })

  const tagPages: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...postPages, ...tagPages]
}
