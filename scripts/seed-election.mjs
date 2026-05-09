/**
 * 選舉民調種子資料 — 2026 六都縣市長
 * 執行方式：
 *   node scripts/seed-election.mjs
 *
 * 需要 .env.local 中有 FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 讀取 .env.local，正確處理引號與 \n 跳脫
const envPath = resolve(__dirname, '../.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  // 去掉外層引號
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  // 把字面 \n 轉成真正的換行（私鑰需要）
  val = val.replace(/\\n/g, '\n')
  process.env[key] = val
}

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({
  credential: cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore(app)

// ────────────────────────────────────────────
// 選區基本資料
// ────────────────────────────────────────────
const RACES = [
  {
    id: 'taipei',
    city: '台北市', region: '北部', order: 1,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '蔣萬安', party: '中國國民黨', color: '#000095' },
      { name: '沈伯洋', party: '民主進步黨', color: '#1b9431' },
    ],
  },
  {
    id: 'new-taipei',
    city: '新北市', region: '北部', order: 2,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '李四川', party: '中國國民黨', color: '#000095' },
      { name: '蘇巧慧', party: '民主進步黨', color: '#1b9431' },
    ],
  },
  {
    id: 'taoyuan',
    city: '桃園市', region: '北部', order: 3,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '張善政', party: '中國國民黨', color: '#000095' },
      { name: '黃世杰', party: '民主進步黨', color: '#1b9431' },
    ],
  },
  {
    id: 'taichung',
    city: '台中市', region: '中部', order: 4,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '江啟臣', party: '中國國民黨', color: '#000095' },
      { name: '何欣純', party: '民主進步黨', color: '#1b9431' },
    ],
  },
  {
    id: 'tainan',
    city: '台南市', region: '南部', order: 5,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '謝龍介', party: '中國國民黨', color: '#000095' },
      { name: '陳亭妃', party: '民主進步黨', color: '#1b9431' },
    ],
  },
  {
    id: 'kaohsiung',
    city: '高雄市', region: '南部', order: 6,
    electionDate: '2026-11-28', isActive: true,
    candidates: [
      { name: '柯志恩', party: '中國國民黨', color: '#000095' },
      { name: '賴瑞隆', party: '民主進步黨', color: '#1b9431' },
    ],
  },
]

// ────────────────────────────────────────────
// 民調資料（資料來源見 url 欄位）
// ────────────────────────────────────────────
const POLLS = [
  // ── 台北市 ──
  {
    raceId: 'taipei',
    source: '趨勢民調（凱達格蘭基金會委託）',
    date: '2026-05-04',
    sampleSize: 1095,
    marginOfError: 2.96,
    url: 'https://news.ltn.com.tw/news/Taipei/breakingnews/5428706',
    results: [
      { name: '蔣萬安', percentage: 52.9 },
      { name: '沈伯洋', percentage: 29.7 },
    ],
  },
  {
    raceId: 'taipei',
    source: 'TVBS 民調中心',
    date: '2026-01-10',
    sampleSize: null,
    marginOfError: null,
    url: 'https://cc.tvbs.com.tw/portal/file/poll_center/2026/20260121/f549e8011d885ed630573b7f936eff9c.pdf',
    results: [
      { name: '蔣萬安', percentage: 50.0 },
      { name: '沈伯洋', percentage: 27.0 },
    ],
  },

  // ── 新北市 ──
  {
    raceId: 'new-taipei',
    source: '山水民意（震傳媒委託）',
    date: '2026-04-30',
    sampleSize: 1070,
    marginOfError: 3.0,
    url: 'https://newtalk.tw/news/view/2026-05-05/1033413',
    results: [
      { name: '李四川', percentage: 39.6 },
      { name: '蘇巧慧', percentage: 34.8 },
    ],
  },
  {
    raceId: 'new-taipei',
    source: 'TVBS 民調中心',
    date: '2026-01-10',
    sampleSize: null,
    marginOfError: null,
    url: 'https://cc.tvbs.com.tw/portal/file/poll_center/2026/20260121/f549e8011d885ed630573b7f936eff9c.pdf',
    results: [
      { name: '李四川', percentage: 47.0 },
      { name: '蘇巧慧', percentage: 32.0 },
    ],
  },

  // ── 桃園市 ──
  {
    raceId: 'taoyuan',
    source: 'TVBS 民調中心',
    date: '2025-12-10',
    sampleSize: 953,
    marginOfError: null,
    url: 'https://news.tvbs.com.tw/politics/3073015',
    results: [
      { name: '張善政', percentage: 61.0 },
      { name: '黃世杰', percentage: 19.0 },
    ],
  },

  // ── 台中市 ──
  {
    raceId: 'taichung',
    source: 'TVBS 民調中心',
    date: '2026-01-20',
    sampleSize: null,
    marginOfError: null,
    url: 'https://cc.tvbs.com.tw/portal/file/poll_center/2026/20260123/e81df25f05002ab1c3e1dbf68d1d320b.pdf',
    results: [
      { name: '江啟臣', percentage: 46.0 },
      { name: '何欣純', percentage: 31.0 },
    ],
  },

  // ── 台南市 ──
  {
    raceId: 'tainan',
    source: '風傳媒委託民調',
    date: '2026-02-25',
    sampleSize: null,
    marginOfError: null,
    url: 'https://www.storm.mg/lifestyle/11108455',
    results: [
      { name: '謝龍介', percentage: 40.6 },
      { name: '陳亭妃', percentage: 46.0 },
    ],
  },

  // ── 高雄市 ──
  {
    raceId: 'kaohsiung',
    source: '山水民意（上報委託）',
    date: '2026-05-03',
    sampleSize: 2027,
    marginOfError: 2.18,
    url: 'https://udn.com/news/story/124652/9482035',
    results: [
      { name: '柯志恩', percentage: 30.7 },
      { name: '賴瑞隆', percentage: 47.0 },
    ],
  },
  {
    raceId: 'kaohsiung',
    source: 'TVBS 民調中心',
    date: '2026-02-13',
    sampleSize: null,
    marginOfError: null,
    url: 'https://newtalk.tw/news/view/2026-02-13/1020087',
    results: [
      { name: '柯志恩', percentage: 27.0 },
      { name: '賴瑞隆', percentage: 45.0 },
    ],
  },
]

async function seed() {
  console.log('🗳️  開始寫入選舉資料...\n')

  // 寫入選區
  for (const race of RACES) {
    const { id, ...data } = race
    await db.collection('electionRaces').doc(id).set(data)
    console.log(`✓ 選區：${data.city} (${id})`)
  }

  console.log('')

  // 寫入民調
  for (const poll of POLLS) {
    const ref = await db.collection('electionPolls').add(poll)
    const race = RACES.find((r) => r.id === poll.raceId)
    console.log(`✓ 民調：${race?.city} ｜ ${poll.source} ｜ ${poll.date} (${ref.id})`)
  }

  console.log('\n✅ 完成！共寫入', RACES.length, '個選區、', POLLS.length, '筆民調。')
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
