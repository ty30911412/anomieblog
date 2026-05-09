'use client'

import { ElectionCandidate } from '@/types'

interface Props {
  candidates: ElectionCandidate[]
  winProb: Record<string, number>
  avgPct: Record<string, number>
  compact?: boolean
}

export default function WinProbabilityBar({ candidates, winProb, avgPct, compact = false }: Props) {
  return (
    <div className="space-y-3">
      {/* 勝率條 */}
      <div className="flex rounded-full overflow-hidden h-4" title="相對勝率（加權民調聚合）">
        {candidates.map((c, i) => (
          <div
            key={c.name}
            style={{ width: `${winProb[c.name] ?? 0}%`, backgroundColor: c.color }}
            className={`transition-all duration-700 ${i === 0 ? '' : ''}`}
          />
        ))}
      </div>

      {/* 各候選人標籤 */}
      <div className={`flex ${compact ? 'gap-4 flex-wrap' : 'justify-between'}`}>
        {candidates.map((c) => (
          <div key={c.name} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: c.color }}
            />
            <div className="min-w-0">
              <div className="font-bold text-ink-800 text-sm truncate">
                {c.name}
                <span className="text-ink-400 font-normal ml-1 text-xs">({c.party})</span>
              </div>
              {!compact && (
                <div className="text-xs text-ink-500">
                  民調 <span className="font-mono font-bold text-ink-700">{avgPct[c.name] ?? 0}%</span>
                  　勝率 <span className="font-mono font-bold" style={{ color: c.color }}>{winProb[c.name] ?? 0}%</span>
                </div>
              )}
              {compact && (
                <div className="text-xs font-mono text-ink-500">
                  {avgPct[c.name] ?? 0}% / 勝率 {winProb[c.name] ?? 0}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
