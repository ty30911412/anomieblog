import { adminDb } from '@/lib/firebase-admin'
import { ElectionRace, ElectionPoll } from '@/types'
import Link from 'next/link'
import { aggregatePolls } from '@/lib/pollAggregator'
import WinProbabilityBar from '@/components/election/WinProbabilityBar'
import { BarChart2, ChevronRight, Info } from 'lucide-react'

export const revalidate = 60

const REGION_ORDER = ['北部', '中部', '南部', '東部', '離島']

async function getData() {
  if (!adminDb) return { races: [], pollsByRace: {} }

  const [racesSnap, pollsSnap] = await Promise.all([
    adminDb.collection('electionRaces').where('isActive', '==', true).get(),
    adminDb.collection('electionPolls').get(),
  ])

  const races = racesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ElectionRace))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  const pollsByRace: Record<string, ElectionPoll[]> = {}
  pollsSnap.docs.forEach((d) => {
    const poll = { id: d.id, ...d.data() } as ElectionPoll
    if (!pollsByRace[poll.raceId]) pollsByRace[poll.raceId] = []
    pollsByRace[poll.raceId].push(poll)
  })

  return { races, pollsByRace }
}

export default async function ElectionPage() {
  const { races, pollsByRace } = await getData()

  const byRegion = REGION_ORDER.map((region) => ({
    region,
    races: races.filter((r) => r.region === region),
  })).filter((g) => g.races.length > 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pt-28 min-h-screen">
      {/* 頁首 */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
          <BarChart2 size={14} />
          <span>即時追蹤</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 mb-3">
          2026 縣市長選舉<br className="md:hidden" />民調追蹤
        </h1>
        <p className="text-ink-500 max-w-xl leading-relaxed">
          整合各機構民調，以加權聚合方法估算相對勝率。勝率為統計模型輸出，非選舉結果預測。
        </p>
        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-lg">
          <Info size={13} className="mt-0.5 shrink-0" />
          <span>
            權重公式：樣本數開根號 × 時間衰減（半衰期 21 天）。僅供學術參考，請勿作為投票依據。
          </span>
        </div>
      </div>

      {races.length === 0 ? (
        <div className="text-center py-24 text-ink-300">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-serif text-lg">民調資料準備中</p>
          <p className="text-sm mt-1">請至後台新增選區與民調數據</p>
        </div>
      ) : (
        <div className="space-y-16">
          {byRegion.map(({ region, races: regionRaces }) => (
            <section key={region}>
              <h2 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-6 h-px bg-ink-300" />
                {region}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {regionRaces.map((race) => {
                  const polls = pollsByRace[race.id] ?? []
                  const agg = aggregatePolls(polls, race.candidates)

                  return (
                    <Link
                      key={race.id}
                      href={`/election/${race.id}`}
                      className="group bg-white border border-ink-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-ink-900 group-hover:text-amber-800 transition-colors">
                            {race.city}
                          </h3>
                          <p className="text-xs text-ink-400 mt-0.5 font-mono">
                            {agg ? `${agg.pollCount} 筆民調` : '尚無資料'}
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          className="text-ink-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all mt-1"
                        />
                      </div>

                      {agg ? (
                        <WinProbabilityBar
                          candidates={race.candidates}
                          winProb={agg.winProb}
                          avgPct={agg.avgPct}
                          compact
                        />
                      ) : (
                        <div className="h-10 flex items-center text-sm text-ink-300">
                          — 尚無民調資料 —
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 方法論說明 */}
      <div className="mt-20 pt-10 border-t border-ink-200/60">
        <h2 className="font-serif text-lg font-bold text-ink-700 mb-3">方法論說明</h2>
        <div className="prose prose-sm prose-stone max-w-2xl text-ink-500 leading-relaxed space-y-2 text-sm">
          <p>本追蹤器整合各民調機構數據，採加權平均聚合方法：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>樣本數權重</strong>：較大樣本的民調獲得較高權重（開根號標準化）</li>
            <li><strong>時間衰減</strong>：越近期的民調權重越高，半衰期設為 21 天</li>
            <li><strong>相對勝率</strong>：各候選人加權平均支持度正規化後的相對比例，非獨立預測模型</li>
          </ul>
          <p className="text-ink-400">數據更新頻率：每有新民調發布即手動更新。</p>
        </div>
      </div>
    </div>
  )
}
