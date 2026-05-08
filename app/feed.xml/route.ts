import { adminDb } from '@/lib/firebase-admin'
import { BlogPost } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anomieblog.vercel.app'
const SITE_NAME = "Liam's note"
const SITE_DESC = '讀書筆記與科普知識分享，涵蓋社會學、文化、人文科學等主題。'

export async function GET() {
  let posts: BlogPost[] = []

  if (adminDb) {
    const snap = await adminDb.collection('posts').orderBy('date', 'desc').limit(20).get()
    posts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
  }

  const items = posts
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/post/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/post/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt}]]></description>
      ${p.tags.map((t) => `<category>${t}</category>`).join('\n      ')}
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
