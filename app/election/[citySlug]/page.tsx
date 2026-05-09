import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ElectionRace, ElectionPoll, BlogPost } from '@/types'
import { aggregatePolls, buildTrendData } from '@/lib/pollAggregator'
import WinProbabilityBar from '@/components/election/WinProbabilityBar'
import PollTrendChart from '@/components/election/PollTrendChart'
import PollSourceTable from '@/components/election/PollSourceTable'
import { ArrowLeft, BarChart2, FileText, Info } from 'lucide-react'
import { Calendar, Clock } from 'lucide-react'
import Image from 'next/image'

export const revalidate = 60

interface Props {
  params: { citySlug: string }
}

async function getData(slug: string) {
  if (!adminDb) return null

  const [raceDoc, pollsSnap, postsSnap] = await Promise.all([
    adminDb.collection('electionRaces').doc(slug).get(),
    adminDb.collection('electionPolls').where('raceId', '==', slug).get(),
    adminDb.collection('posts')
      .where('electionRaceId', '==', slug)
      .orderBy('date', 'desc')
      .get(),
  ])

  if (!raceDoc.exists) return null

  const race = { id: raceDoc.id, ...raceDoc.data() } as ElectionRace
  const polls = pollsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ElectionPoll))
  const articles = postsSnap.docs.map((d) => ({ id: d.id, slug: d.id, ...d.data() } as BlogPost))

  return { race, polls, articles }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!adminDb) return { title: '選舉追蹤' }
  const doc = await adminDb.collection('electionRaces').doc(params.citySlug).get()
  if (!doc.exists) return { title: '選舉追蹤' }
  const race = doc.data() as ElectionRace
  return {
    title: `${race.city}｜2026 縣市長民調`,
    description: `${race.city} 2026 縣市長選舉民調聚合與勝率分析`,
  }
}

export default async function CityElectionPage({ params }: Props) {
  const data = await getData(params.citySlug)
  if (!data) notFound()

  const { race, polls, articles } = data
  const agg = aggregatePolls(polls, race.candidates)
  const trendData = buildTrendData(polls, race.candidates)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pt-28 min-h-screen">
      {/* 麵包屑 */}
      <Link
        href="/election"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 transition-colors mb-8"
      >
        <ArrowLeft size={14} /> 回選舉總覽
      </Link>

      {/* 標題 */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">
          <BarChart2 size={13} />
          <span>2026 縣市長 · {race.region}</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 mb-2">
          {race.city}
        </h1>
        <p className="text-ink-400 text-sm font-mono">
          選舉日期：{race.electionDate}　·　共 {polls.length} 筆民調
        </p>
      </div>

      {/* 勝率區塊 */}
      <div className="bg-white border border-ink-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">加權民調聚合</h2>
          <div className="flex items-center gap-1.5 text-xs text-ink-400">
            <Info size={12} />
            <span>樣本數 × 時間衰減加權</span>
          </div>
        </div>

        {agg ? (
          <WinProbabilityBar
            candidates={race.candidates}
            winProb={agg.winProb}
            avgPct={agg.avgPct}
          />
        ) : (
          <p className="text-ink-300 text-sm">尚無民調資料</p>
        )}
      </div>

      {/* 趨勢折線圖 */}
      <div className="bg-white border border-ink-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-ink-900 mb-6">民調趨勢</h2>
        <PollTrendChart data={trendData} candidates={race.candidates} />
      </div>

      {/* 民調明細表 */}
      <div className="mb-12">
        <h2 className="font-serif text-xl font-bold text-ink-900 mb-4">民調明細</h2>
        <PollSourceTable polls={polls} candidates={race.candidates} />
      </div>

      {/* 分析文章 */}
      {articles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText size={16} className="text-ink-400" />
            <h2 className="font-serif text-xl font-bold text-ink-900">深度分析</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((post) => (
              <Link
                key={post.slug}
                href={`/post/${post.slug}`}
                className="group flex gap-4 bg-white border border-ink-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all"
              >
                {post.coverImage && (
                  <div className="w-24 h-20 shrink-0 relative rounded-lg overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-ink-400 font-mono mb-1">
                    <Calendar size={10} />{post.date}
                    <Clock size={10} />{post.readTime}
                  </div>
                  <h3 className="font-serif font-bold text-ink-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
