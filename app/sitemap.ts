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

  return [...staticPages, ...postPages]
}
