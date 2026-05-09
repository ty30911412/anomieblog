'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ElectionRace, ElectionPoll, BlogPost } from '@/types'
import { aggregatePolls, buildTrendData, pollUncertainty } from '@/lib/pollAggregator'

// 2022 縣市長得票率作為選民結構基準（藍綠對決格局）
// 資料來源：中選會 2022 年選舉結果
const STRUCTURAL_PRIOR: Record<string, Record<string, number>> = {
  'taipei':     { '蔣萬安': 62.0, '陳時中': 31.8 },   // 蔣62 vs 陳31
  'new-taipei': { '侯友宜': 69.9, '林佳龍': 25.5 },   // 侯70 vs 林25（以2022格局推估新候選人基準）
  'taoyuan':    { '張善政': 54.8, '鄭運鵬': 38.2 },   // 張55 vs 鄭38
  'taichung':   { '盧秀燕': 58.5, '蔡其昌': 36.5 },   // 盧59 vs 蔡37（接班人基準）
  'tainan':     { '謝龍介': 36.6, '黃偉哲': 59.8 },   // 謝37 vs 黃60（接班人基準）
  'kaohsiung':  { '柯志恩': 37.3, '陳其邁': 59.9 },   // 柯37 vs 陳60（接班人基準）
}
import WinProbabilityBar from '@/components/election/WinProbabilityBar'
import PollTrendChart from '@/components/election/PollTrendChart'
import PollSourceTable from '@/components/election/PollSourceTable'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart2, Info, Calendar, Clock, FileText } from 'lucide-react'

export default function ElectionPage() {
  const [races, setRaces] = useState<ElectionRace[]>([])
  const [polls, setPolls] = useState<ElectionPoll[]>([])
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const [rSnap, pSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'electionRaces')),
        getDocs(collection(db, 'electionPolls')),
        getDocs(collection(db, 'posts')),
      ])

      const r = rSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ElectionRace))
        .filter((r) => r.isActive)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

      const p = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ElectionPoll))

      const a = aSnap.docs
        .map((d) => ({ id: d.id, slug: d.id, ...d.data() } as BlogPost & { electionRaceId?: string })        )
        .filter((post) => (post as any).electionRaceId)

      setRaces(r)
      setPolls(p)
      setArticles(a)
      if (r.length > 0) setSelectedId(r[0].id)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const selectedRace = useMemo(
    () => races.find((r) => r.id === selectedId) ?? null,
    [races, selectedId]
  )

  const selectedPolls = useMemo(
    () => polls.filter((p) => p.raceId === selectedId),
    [polls, selectedId]
  )

  const selectedArticles = useMemo(
    () => articles.filter((a) => (a as any).electionRaceId === selectedId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [articles, selectedId]
  )

  const agg = useMemo(
    () => selectedRace
      ? aggregatePolls(
          selectedPolls,
          selectedRace.candidates,
          STRUCTURAL_PRIOR[selectedRace.id],
          selectedRace.electionDate,
        )
      : null,
    [selectedPolls, selectedRace]
  )

  const trendData = useMemo(
    () => selectedRace ? buildTrendData(selectedPolls, selectedRace.candidates) : [],
    [selectedPolls, selectedRace]
  )

  // 依地區分組顯示選區 tabs
  const REGION_ORDER = ['北部', '中部', '南部', '東部', '離島']
  const byRegion = REGION_ORDER
    .map((region) => ({ region, races: races.filter((r) => r.region === region) }))
    .filter((g) => g.races.length > 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pt-28 min-h-screen">
      {/* 頁首 */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
          <BarChart2 size={14} />
          <span>即時追蹤</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 mb-3">
          2026 縣市長選舉民調
        </h1>
        <p className="text-ink-500 max-w-xl leading-relaxed text-sm">
          整合各機構民調，以加權聚合方法估算相對勝率。數據僅供學術參考。
        </p>
        <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-lg">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            權重：樣本數開根號 × 時間衰減（半衰期 21 天）。勝率為加權民調聚合後正規化數值，非獨立預測模型。
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-ink-300 font-serif">載入中...</div>
      ) : races.length === 0 ? (
        <div className="text-center py-24 text-ink-300">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-serif">民調資料準備中</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── 左側：選區選擇器 ── */}
          <aside className="lg:w-52 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {byRegion.map(({ region, races: regionRaces }) => (
                <div key={region}>
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-2 px-1">
                    {region}
                  </p>
                  <div className="flex flex-row lg:flex-col gap-1.5 flex-wrap">
                    {regionRaces.map((race) => {
                      const racePolls = polls.filter((p) => p.raceId === race.id)
                      const raceAgg = aggregatePolls(racePolls, race.candidates, STRUCTURAL_PRIOR[race.id], race.electionDate)
                      const leader = raceAgg?.leader
                      const isSelected = selectedId === race.id

                      return (
                        <button
                          key={race.id}
                          onClick={() => setSelectedId(race.id)}
                          className={`
                            text-left px-3 py-2.5 rounded-xl transition-all duration-200 border w-full
                            ${isSelected
                              ? 'bg-ink-900 text-white border-ink-900 shadow-md'
                              : 'bg-white text-ink-700 border-ink-200 hover:border-amber-300 hover:bg-amber-50/50'
                            }
                          `}
                        >
                          <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-ink-800'}`}>
                            {race.city}
                          </div>
                          {leader && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: leader.color }}
                              />
                              <span className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-ink-400'}`}>
                                {leader.name} 領先
                              </span>
                            </div>
                          )}
                          {!leader && (
                            <div className={`text-[11px] ${isSelected ? 'text-white/50' : 'text-ink-300'}`}>
                              尚無資料
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── 右側：主內容 ── */}
          <main className="flex-1 min-w-0 space-y-6">
            {selectedRace && (
              <>
                {/* 選區標題 */}
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif text-3xl font-bold text-ink-900">
                    {selectedRace.city}
                  </h2>
                  <span className="text-ink-400 text-sm font-mono">
                    {selectedPolls.length} 筆民調
                  </span>
                </div>

                {/* 勝率區塊 */}
                <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest mb-5">
                    加權聚合勝率
                  </h3>
                  {agg ? (
                    <WinProbabilityBar
                      candidates={selectedRace.candidates}
                      winProb={agg.winProb}
                      predictedProb={agg.predictedProb}
                      avgPct={agg.avgPct}
                      uncertainty={agg.uncertainty}
                      confidenceInterval={agg.confidenceInterval}
                      pollWeight={agg.pollWeight}
                      daysToElection={agg.daysToElection}
                    />
                  ) : (
                    <p className="text-ink-300 text-sm">尚無民調資料</p>
                  )}
                </div>

                {/* 趨勢圖 */}
                <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest mb-5">
                    民調走勢
                  </h3>
                  <PollTrendChart data={trendData} candidates={selectedRace.candidates} />
                </div>

                {/* 民調明細 */}
                <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest mb-4">
                    民調明細
                  </h3>
                  <PollSourceTable polls={selectedPolls} candidates={selectedRace.candidates} />
                </div>

                {/* 相關分析文章 */}
                {selectedArticles.length > 0 && (
                  <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText size={14} className="text-ink-400" />
                      <h3 className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest">
                        深度分析
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {selectedArticles.map((post) => (
                        <Link
                          key={post.slug}
                          href={`/post/${post.slug}`}
                          className="group flex gap-4 items-center hover:bg-ink-50 rounded-xl p-2 -mx-2 transition-colors"
                        >
                          {post.coverImage && (
                            <div className="w-16 h-12 shrink-0 relative rounded-lg overflow-hidden">
                              <Image
                                src={post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-ink-400 font-mono mb-0.5">
                              <Calendar size={10} />{post.date}
                              <Clock size={10} />{post.readTime}
                            </div>
                            <h4 className="font-serif font-bold text-ink-800 text-sm leading-snug line-clamp-1 group-hover:text-amber-800 transition-colors">
                              {post.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* 方法論 */}
      <div className="mt-16 pt-8 border-t border-ink-200/60 text-xs text-ink-400 max-w-2xl space-y-1">
        <p className="font-bold text-ink-500">方法論說明</p>
        <p>
          各民調以 <code className="bg-ink-100 px-1 rounded">w = √(n/1000) × e^(-d/21)</code> 加權（n：樣本數，d：距今天數），
          各候選人加權平均後正規化為相對勝率。數值僅反映民調聚合結果，不代表最終選舉預測。
        </p>
      </div>
    </div>
  )
}
