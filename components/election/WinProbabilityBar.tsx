'use client'

import { ElectionCandidate } from '@/types'

interface Props {
  candidates: ElectionCandidate[]
  winProb: Record<string, number>
  predictedProb: Record<string, number>
  avgPct: Record<string, number>
  uncertainty: Record<string, number>
  confidenceInterval: Record<string, [number, number]>
  pollWeight: number
  daysToElection: number
  compact?: boolean
}

export default function WinProbabilityBar({
  candidates,
  winProb,
  predictedProb,
  avgPct,
  uncertainty,
  confidenceInterval,
  pollWeight,
  daysToElection,
  compact = false,
}: Props) {
  const leader = candidates.reduce((a, b) =>
    (predictedProb[a.name] ?? 0) >= (predictedProb[b.name] ?? 0) ? a : b
  )

  const isDataSparse = pollWeight < 0.4

  return (
    <div className="space-y-4">

      {/* 預測勝率條 */}
      <div>
        {!compact && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
              預測勝率
            </span>
            <span className="text-[10px] text-ink-300 font-mono">
              民調權重 {Math.round(pollWeight * 100)}%
              {pollWeight < 1 && ` · 距選舉 ${daysToElection} 天`}
            </span>
          </div>
        )}
        <div className="flex rounded-full overflow-hidden h-5 shadow-inner bg-ink-100">
          {candidates.map((c) => (
            <div
              key={c.name}
              style={{ width: `${predictedProb[c.name] ?? 0}%`, backgroundColor: c.color }}
              className="transition-all duration-700 flex items-center justify-center"
              title={`${c.name} 預測勝率 ${predictedProb[c.name]}%`}
            >
              {(predictedProb[c.name] ?? 0) > 15 && (
                <span className="text-white text-[10px] font-bold font-mono">
                  {predictedProb[c.name]}%
                </span>
              )}
            </div>
          ))}
        </div>
        {!compact && isDataSparse && (
          <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
            <span>⚠</span>
            民調筆數不足，預測主要依賴 2022 選民結構先驗，不確定性較高
          </p>
        )}
      </div>

      {/* 各候選人卡片 */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : `grid-cols-${Math.min(candidates.length, 3)}`}`}>
        {candidates.map((c) => {
          const isLeader = c.name === leader.name
          const ci = confidenceInterval[c.name]
          const u = uncertainty[c.name]

          return (
            <div
              key={c.name}
              className={`rounded-xl p-3 border transition-all ${
                isLeader ? 'border-current bg-white shadow-sm' : 'border-ink-100 bg-ink-50/50'
              }`}
              style={isLeader ? { borderColor: c.color + '60' } : {}}
            >
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="font-bold text-ink-800 text-sm">{c.name}</span>
                <span className="text-ink-400 text-xs">({c.party})</span>
                {!compact && c.incumbencyStatus && c.incumbencyStatus !== 'challenger' && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-ink-100 text-ink-500 font-mono">
                    {c.incumbencyStatus === 'incumbent' ? '現任' : '接班'}
                  </span>
                )}
                {isLeader && !compact && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    領先
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {/* 民調均值 */}
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-ink-400">民調均值</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-ink-700 text-sm">{avgPct[c.name] ?? 0}%</span>
                    {!compact && u !== undefined && (
                      <span className="text-[10px] text-ink-300 font-mono ml-1">±{u}pp</span>
                    )}
                  </div>
                </div>

                {/* 95% CI 視覺條 */}
                {!compact && ci && avgPct[c.name] > 0 && (
                  <div className="relative h-1.5 bg-ink-100 rounded-full">
                    <div
                      className="absolute h-1.5 rounded-full opacity-25"
                      style={{
                        backgroundColor: c.color,
                        left: `${Math.min(ci[0], 85)}%`,
                        width: `${Math.max(1, Math.min(ci[1] - ci[0], 40))}%`,
                      }}
                    />
                    <div
                      className="absolute w-0.5 h-2.5 -top-0.5 rounded-full opacity-70"
                      style={{
                        backgroundColor: c.color,
                        left: `${Math.min(avgPct[c.name], 90)}%`,
                      }}
                    />
                  </div>
                )}

                {!compact && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-ink-400">純民調勝率</span>
                    <span className="font-mono text-ink-500 text-xs">{winProb[c.name] ?? 0}%</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-ink-400">預測勝率</span>
                  <span className="font-mono font-bold text-sm" style={{ color: c.color }}>
                    {predictedProb[c.name] ?? 0}%
                  </span>
                </div>

                {!compact && ci && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-ink-300">95% CI</span>
                    <span className="font-mono text-[10px] text-ink-300">{ci[0]}–{ci[1]}%</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
