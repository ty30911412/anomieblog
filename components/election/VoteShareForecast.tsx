'use client'

import { ElectionCandidate } from '@/types'
import { AggregationResult } from '@/lib/pollAggregator'
import { TrendingUp } from 'lucide-react'

interface Props {
  candidates: ElectionCandidate[]
  agg: AggregationResult
}

export default function VoteShareForecast({ candidates, agg }: Props) {
  const { projectedVoteShare, voteShareCI, pollVoteShare, declaredTotal } = agg
  const undecided = Math.max(0, Math.round((100 - declaredTotal) * 10) / 10)

  // 視覺用：最大得票率決定橫條寬度基準
  const maxVote = Math.max(...candidates.map((c) => voteShareCI[c.name]?.[1] ?? 0), 60)

  return (
    <div className="space-y-5">
      {/* 未表態提示 */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ink-400">
          民調表態率：<span className="font-mono font-bold text-ink-600">{declaredTotal}%</span>
          <span className="text-ink-300 ml-2">（未表態 {undecided}% 按比例 60% 分配、40% 歸棄票/小黨）</span>
        </span>
      </div>

      {/* 各候選人得票率預測 */}
      <div className="space-y-4">
        {candidates.map((c) => {
          const proj = projectedVoteShare[c.name] ?? 0
          const ci = voteShareCI[c.name] ?? [0, 0]
          const pollAdj = pollVoteShare[c.name] ?? 0
          const barWidth = (proj / maxVote) * 100
          const ciLow = (ci[0] / maxVote) * 100
          const ciHigh = (ci[1] / maxVote) * 100

          return (
            <div key={c.name} className="space-y-1.5">
              {/* 候選人名 + 數字 */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-bold text-ink-800 text-sm">{c.name}</span>
                  <span className="text-ink-400 text-xs">（{c.party}）</span>
                  {c.incumbencyStatus && c.incumbencyStatus !== 'challenger' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 font-mono">
                      {c.incumbencyStatus === 'incumbent' ? '現任' : '接班'}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-lg" style={{ color: c.color }}>
                    {proj}%
                  </span>
                  <span className="text-ink-300 font-mono text-xs ml-1.5">
                    {ci[0]}–{ci[1]}%
                  </span>
                </div>
              </div>

              {/* 橫條：CI 範圍 + 點估計 */}
              <div className="relative h-6 bg-ink-100 rounded-lg overflow-visible">
                {/* CI 範圍（淡色底） */}
                <div
                  className="absolute top-0 h-6 rounded-lg opacity-20 transition-all duration-700"
                  style={{
                    backgroundColor: c.color,
                    left: `${ciLow}%`,
                    width: `${Math.max(1, ciHigh - ciLow)}%`,
                  }}
                />
                {/* 點估計（實心條） */}
                <div
                  className="absolute top-1 h-4 rounded-md opacity-80 transition-all duration-700"
                  style={{
                    backgroundColor: c.color,
                    width: `${Math.max(1, barWidth)}%`,
                  }}
                />
                {/* 得票率標籤 */}
                {barWidth > 15 && (
                  <span
                    className="absolute top-1 right-0 h-4 flex items-center pr-2 text-[10px] font-mono font-bold text-white"
                    style={{ width: `${barWidth}%` }}
                  >
                    {proj}%
                  </span>
                )}
              </div>

              {/* 次要數字：民調調整前後 */}
              <div className="flex gap-4 text-[10px] text-ink-400 font-mono pl-4">
                <span>民調均值 {agg.avgPct[c.name] ?? 0}%</span>
                <span className="text-ink-300">→</span>
                <span>含未表態分配 {pollAdj}%</span>
                <span className="text-ink-300">→</span>
                <span>混合先驗 <strong style={{ color: c.color }}>{proj}%</strong></span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 說明 */}
      <div className="text-[10px] text-ink-300 border-t border-ink-100 pt-3 space-y-0.5">
        <p>90% 預測區間（橫條淡色段），反映民調分歧度 + 選民結構轉移風險。</p>
        <p>得票率 ≠ 勝率：兩候選人加總不為 100%，差值為棄票、小黨與無效票估算。</p>
        <p>參考文獻：Jennings & Wlezien (2016), Yu & Lim (2021), Abramowitz (2012)。</p>
      </div>
    </div>
  )
}
