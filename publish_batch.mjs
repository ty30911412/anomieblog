// 執行方式：node publish_batch.mjs
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

// 讀取 .env.local
const envFile = readFileSync(join(__dir, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const [k, ...v] = l.split('=')
      return [k.trim(), v.join('=').trim().replace(/^["']|["']$/g, '')]
    })
)

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// 從 markdown 檔案讀取內容
function readMarkdown(filename) {
  return readFileSync(join(__dir, 'drafts', filename), 'utf-8')
}

// 計算閱讀時間（中文每分鐘約 400 字）
function calcReadTime(content) {
  const charCount = content.replace(/\s/g, '').length
  const minutes = Math.max(5, Math.round(charCount / 400))
  return `${minutes} 分鐘`
}

// 從 markdown 中提取標題（第一行 # ...）
function extractTitle(md) {
  const match = md.match(/^#\s+(.+)/m)
  return match ? match[1].trim() : ''
}

// 移除第一行標題，保留正文
function extractContent(md) {
  return md.replace(/^#\s+.+\n\n?/, '').trim()
}

const posts = [
  {
    slug: 'taiwan-low-fertility-sociology',
    file: 'taiwan-low-fertility-sociology.md',
    excerpt: '2024 年台灣總生育率降至全球最低 0.87。這不只是人口統計的警訊，更是一份社會診斷書。從 Peter McDonald 的性別平等理論出發，解析「低薪、高房價、長工時」三重壓縮如何讓生育成為一種奢侈。',
    coverImage: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&q=80&w=1400',
    tags: ['少子化', '生育率', '性別平等', '台灣社會', '人口學', '社會結構'],
    date: '2026-05-09',
  },
  {
    slug: 'taiwan-class-mobility-sociology',
    file: 'taiwan-class-mobility-sociology.md',
    excerpt: '台灣最富裕 20% 家庭的財富是最貧困 20% 的 66.9 倍。Chetty 的美國研究顯示出生底層爬升頂層的機率只有 7.5%。努力真的可以突破階級嗎？本文從布迪厄的資本理論與 Miles Corak 的「大蓋茨比曲線」，梳理階級固化的社會學實證。',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1400',
    tags: ['階級流動', '社會不平等', '布迪厄', '文化資本', '大蓋茨比曲線', '台灣社會'],
    date: '2026-05-10',
  },
  {
    slug: 'taiwan-youth-mental-health',
    file: 'taiwan-youth-mental-health.md',
    excerpt: '兒福聯盟 2025 年調查：台灣近四成青少年面臨情緒困擾，17.7% 達中重度；15-24 歲憂鬱症診斷十年成長 88.2%。有困擾的青少年中，46.5% 先向 AI 求助，高於向輔導室求助的比例。這是個人問題，還是系統性危機？',
    coverImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1400',
    tags: ['青少年心理健康', '憂鬱症', '社群媒體', 'Haidt', '台灣教育', '公共衛生'],
    date: '2026-05-10',
  },
  {
    slug: 'taiwan-marriage-gender',
    file: 'taiwan-marriage-gender.md',
    excerpt: '台灣女性有偶率跌至歷史新低 48.37%；25-29 歲女性僅 17.72% 已婚。但這是「不想結婚」嗎？數據顯示，67% 未婚女性強烈不認同「不好的婚姻也比單身好」。本文從性別不平等與婚姻制度角度，解析台灣的「不婚潮」。',
    coverImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1400',
    tags: ['婚姻', '性別平等', '不婚', '家務分工', 'McDonald', '台灣社會'],
    date: '2026-05-10',
  },
  {
    slug: 'social-media-loneliness',
    file: 'social-media-loneliness.md',
    excerpt: 'WHO 估計全球六分之一人口受孤獨影響，慢性孤獨每年造成近 87 萬人過早死亡。矛盾的是，Z 世代是最「連結」的一代，孤獨指數卻是最高的。從 Granovetter 的弱連結理論到社群媒體的「比較與絕望」循環，解析現代孤獨的結構。',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1400',
    tags: ['孤獨', '社群媒體', 'Z世代', '社會連結', 'WHO', '心理健康'],
    date: '2026-05-11',
  },
]

async function main() {
  console.log('🚀 連接 Firebase...\n')

  for (const meta of posts) {
    const md = readMarkdown(meta.file)
    const title = extractTitle(md)
    const content = extractContent(md)
    const readTime = calcReadTime(content)

    const post = {
      slug: meta.slug,
      title,
      excerpt: meta.excerpt,
      content,
      date: meta.date,
      readTime,
      coverImage: meta.coverImage,
      tags: meta.tags,
      initialLikes: 0,
    }

    try {
      await db.collection('posts').doc(meta.slug).set(post)
      console.log(`✅ ${title}`)
      console.log(`   閱讀時間：${readTime} ／ slug: ${meta.slug}\n`)
    } catch (err) {
      console.error(`❌ 發布失敗 [${meta.slug}]：`, err.message)
    }
  }

  console.log('🎉 全部完成！')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ 腳本錯誤：', err.message)
  process.exit(1)
})
