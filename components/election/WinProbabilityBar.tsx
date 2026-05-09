'use client'

import { ElectionCandidate } from '@/types'

interface Props {
  candidates: ElectionCandidate[]
  winProb: Record<string, number>         // 純民調勝率
  predictedProb: Record<string, number>   // 混合預測勝率
  avgPct: Record<string, number>
  pollWeight: number                       // 民調佔預測的比重
  compact?: boolean
}

export default function WinProbabilityBar({
  candidates, winProb, predictedProb, avgPct, pollWeight, compact = false,
}: Props) {
  const leader = candidates.reduce((a, b) =>
    (predictedProb[a.name] ?? 0) >= (predictedProb[b.name] ?? 0) ? a : b
  )

  return (
    <div className="space-y-4">
      {/* 預測勝率條（混合模型） */}
      <div>
        {!compact && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
              預測勝率
            </span>
            <span className="text-[10px] text-ink-300">
              民調權重 {Math.round(pollWeight * 100)}%
              {pollWeight < 1 && ' + 選民結構'}
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
      </div>

      {/* 各候選人詳細數字 */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : `grid-cols-${Math.min(candidates.length, 3)}`}`}>
        {candidates.map((c) => {
          const isLeader = c.name === leader.name
          return (
            <div
              key={c.name}
              className={`rounded-xl p-3 border transition-all ${
                isLeader
                  ? 'border-current bg-white shadow-sm'
                  : 'border-ink-100 bg-ink-50/50'
              }`}
              style={isLeader ? { borderColor: c.color + '60' } : {}}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="font-bold text-ink-800 text-sm">{c.name}</span>
                <span className="text-ink-400 text-xs">({c.party})</span>
                {isLeader && !compact && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: c.color }}>
                    領先
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-ink-400">民調均值</span>
                  <span className="font-mono font-bold text-ink-700 text-sm">{avgPct[c.name] ?? 0}%</span>
                </div>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
