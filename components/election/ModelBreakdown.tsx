'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'
import { ElectionCandidate, IncumbencyStatus } from '@/types'
import { AggregationResult } from '@/lib/pollAggregator'

interface Props {
  race: {
    id: string
    city: string
    electionDate: string
    candidates: ElectionCandidate[]
  }
  agg: AggregationResult
  structuralPrior: Record<string, number> | undefined
}

const INCUMBENCY_LABEL: Record<IncumbencyStatus, string> = {
  incumbent:       '現任連任 −3.0pp',
  party_successor: '同黨接班 −1.5pp',
  challenger:      '挑戰方   ±0pp',
}

const INCUMBENCY_COLOR: Record<IncumbencyStatus, string> = {
  incumbent:       'text-rose-500',
  party_successor: 'text-amber-600',
  challenger:      'text-ink-400',
}

export default function ModelBreakdown({ race, agg, structuralPrior }: Props) {
  const [open, setOpen] = useState(false)

  const daysToElection = agg.daysToElection
  const alpha = agg.pollWeight

  // 還原 timeFactor 與 pollCoverageFactor（與 pollAggregator 邏輯一致）
  const timeFactor = daysToElection === 0
    ? 1.0
    : 1 / (1 + Math.exp((daysToElection - 90) / 30))
  const pollCoverageFactor = Math.min(1, agg.pollCount / 3)

  // 先驗正規化值
  const priorTotal = structuralPrior
    ? Object.values(structuralPrior).reduce((a, b) => a + b, 0)
    : 0
  const normalizedPrior: Record<string, number> = {}
  if (structuralPrior && priorTotal > 0) {
    race.candidates.forEach((c) => {
      normalizedPrior[c.name] = Math.round((structuralPrior[c.name] ?? 0) / priorTotal * 1000) / 10
    })
  }

  // 現任者調整後的先驗
  const INCUMBENCY_ADJ: Record<IncumbencyStatus, number> = {
    incumbent: -3.0, party_successor: -1.5, challenger: 0,
  }
  const adjustedRaw: Record<string, number> = {}
  race.candidates.forEach((c) => {
    const status = c.incumbencyStatus ?? 'challenger'
    adjustedRaw[c.name] = (normalizedPrior[c.name] ?? 0) + INCUMBENCY_ADJ[status]
  })
  const adjTotal = Object.values(adjustedRaw).reduce((a, b) => a + b, 0)
  const adjustedPrior: Record<string, number> = {}
  race.candidates.forEach((c) => {
    adjustedPrior[c.name] = adjTotal > 0
      ? Math.round(adjustedRaw[c.name] / adjTotal * 1000) / 10
      : normalizedPrior[c.name] ?? 0
  })

  return (
    <div className="border border-ink-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* 標題列（可點擊展開） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-ink-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-ink-400" />
          <span className="font-sans text-xs font-bold text-ink-500 uppercase tracking-widest">
            模型參數
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-ink-300" />
          : <ChevronDown size={14} className="text-ink-300" />
        }
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-ink-100">

          {/* ── α 分解 ── */}
          <section className="pt-5">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              混合權重 α（民調 vs 結構先驗）
            </p>
            <div className="grid grid-cols-3 gap-3">
              {/* 時間因子 */}
              <div className="bg-ink-50 rounded-xl p-3">
                <p className="text-xs text-ink-500 mb-1">時間因子</p>
                <p className="font-mono font-bold text-ink-800 text-lg">
                  {Math.round(timeFactor * 100)}%
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  距選舉 {daysToElection} 天
                </p>
                <div className="mt-2 h-1 bg-ink-200 rounded-full">
                  <div
                    className="h-1 bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.round(timeFactor * 100)}%` }}
                  />
                </div>
              </div>

              {/* 民調覆蓋因子 */}
              <div className="bg-ink-50 rounded-xl p-3">
                <p className="text-xs text-ink-500 mb-1">民調覆蓋因子</p>
                <p className="font-mono font-bold text-ink-800 text-lg">
                  {Math.round(pollCoverageFactor * 100)}%
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  {agg.pollCount} 筆 ÷ 飽和值 3 筆
                </p>
                <div className="mt-2 h-1 bg-ink-200 rounded-full">
                  <div
                    className="h-1 bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.round(pollCoverageFactor * 100)}%` }}
                  />
                </div>
              </div>

              {/* 最終 α */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 mb-1 font-bold">最終 α（乘積）</p>
                <p className="font-mono font-bold text-amber-800 text-lg">
                  {Math.round(alpha * 100)}%
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  民調占最終預測比重
                </p>
                <div className="mt-2 h-1 bg-amber-200 rounded-full">
                  <div
                    className="h-1 bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.round(alpha * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-2 font-mono">
              α = 時間因子 × 民調覆蓋因子 = {Math.round(timeFactor * 100)}% × {Math.round(pollCoverageFactor * 100)}% = {Math.round(alpha * 100)}%
            </p>
            <p className="text-xs text-ink-400 font-mono">
              時間因子 = 1 / (1 + e^((d−90)/30))，d={daysToElection}；民調覆蓋因子 = min(1, n/3)
            </p>
            <p className="text-xs text-ink-400 mt-1">
              乘積設計：距選舉遠時即使民調多、預測力仍低；民調少時即使近選舉、雜訊仍大——兩者同時滿足才信任民調。
            </p>
          </section>

          {/* ── 混合先驗 ── */}
          {structuralPrior && (
            <section>
              <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-1">
                選民結構先驗（混合基準）
              </p>
              <p className="text-xs text-ink-400 mb-3">
                40% × 2022縣市長兩黨比 + 60% × 2024總統兩黨比（排除民眾黨）
              </p>
              <div className="space-y-2">
                {race.candidates.map((c) => {
                  const raw = structuralPrior[c.name] ?? 0
                  const norm = normalizedPrior[c.name] ?? 0
                  const adj = adjustedPrior[c.name] ?? 0
                  const status = c.incumbencyStatus ?? 'challenger'
                  const delta = INCUMBENCY_ADJ[status]
                  return (
                    <div key={c.name} className="flex items-center gap-3 text-xs">
                      {/* 色點 + 名字 */}
                      <div className="flex items-center gap-1.5 w-24 shrink-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="font-bold text-ink-700 truncate">{c.name}</span>
                      </div>
                      {/* 2022 原始得票 */}
                      <div className="text-ink-400 font-mono w-14 text-right shrink-0">
                        {raw}%
                        <span className="text-xs text-ink-400 ml-0.5">原始</span>
                      </div>
                      {/* 箭頭 */}
                      <span className="text-ink-300">→</span>
                      {/* 正規化 */}
                      <div className="text-ink-500 font-mono w-14 text-right shrink-0">
                        {norm}%
                        <span className="text-xs text-ink-400 ml-0.5">正規</span>
                      </div>
                      {/* 現任者調整 */}
                      <div className={`font-mono w-16 text-right shrink-0 ${INCUMBENCY_COLOR[status]}`}>
                        {delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}pp` : '—'}
                      </div>
                      {/* 調整後先驗 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 rounded-full opacity-50"
                            style={{ width: `${adj}%`, backgroundColor: c.color, minWidth: 2 }}
                          />
                          <span className="font-mono font-bold text-ink-700">{adj}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-ink-400 mt-2">
                正規化後加入現任者效應調整，作為最終結構先驗（佔預測 {Math.round((1 - alpha) * 100)}%）
              </p>
            </section>
          )}

          {/* ── 民調聚合貢獻 ── */}
          <section>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              民調聚合結果（佔預測 {Math.round(alpha * 100)}%）
            </p>
            <div className="space-y-2">
              {race.candidates.map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 w-24 shrink-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-bold text-ink-700 truncate">{c.name}</span>
                  </div>
                  <div className="text-ink-500 font-mono w-14 text-right shrink-0">
                    {agg.avgPct[c.name] ?? 0}%
                    <span className="text-xs text-ink-400 ml-0.5">均值</span>
                  </div>
                  <span className="text-ink-300">→</span>
                  <div className="text-ink-500 font-mono w-16 text-right shrink-0">
                    {agg.winProb[c.name] ?? 0}%
                    <span className="text-xs text-ink-400 ml-0.5">勝率</span>
                  </div>
                  <div className="text-xs text-ink-400 font-mono w-20 text-right shrink-0">
                    ±{agg.uncertainty[c.name] ?? 0}pp
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-1.5 rounded-full opacity-50"
                        style={{ width: `${agg.winProb[c.name] ?? 0}%`, backgroundColor: c.color, minWidth: 2 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 最終混合公式 ── */}
          <section className="bg-ink-50 rounded-xl p-4">
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              最終預測公式
            </p>
            <p className="text-xs font-mono text-ink-500 mb-2">
              預測勝率 = α × 純民調勝率 + (1−α) × 調整後結構先驗
            </p>
            <div className="space-y-1.5">
              {race.candidates.map((c) => {
                const poll = agg.winProb[c.name] ?? 0
                const prior = adjustedPrior[c.name] ?? 0
                const pred = agg.predictedProb[c.name] ?? 0
                return (
                  <div key={c.name} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-ink-600 w-14 shrink-0">{c.name}</span>
                    <span className="text-ink-400">
                      = {Math.round(alpha * 100)}% × {poll}%
                      {structuralPrior && ` + ${Math.round((1 - alpha) * 100)}% × ${prior}%`}
                    </span>
                    <span className="text-ink-300 mx-1">→</span>
                    <span className="font-bold" style={{ color: c.color }}>{pred}%</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── 得票率預測分解 ── */}
          <section>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3">
              得票率預測公式
            </p>
            <p className="text-xs font-mono text-ink-500 mb-2">
              得票率 = α × (民調均值 + 未表態×60%分配) + (1−α) × (混合先驗 + 現任者效應)
            </p>
            <div className="space-y-1.5">
              {race.candidates.map((c) => {
                const pollAdj = agg.pollVoteShare?.[c.name] ?? 0
                const proj = agg.projectedVoteShare?.[c.name] ?? 0
                const ci = agg.voteShareCI?.[c.name] ?? [0, 0]
                const priorVS = structuralPrior
                  ? (structuralPrior[c.name] ?? 0) + INCUMBENCY_ADJ[c.incumbencyStatus ?? 'challenger']
                  : pollAdj
                return (
                  <div key={c.name} className="flex items-center gap-2 text-xs font-mono flex-wrap">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-ink-600 w-14 shrink-0">{c.name}</span>
                    <span className="text-ink-400">
                      = {Math.round(alpha * 100)}% × {pollAdj}%
                      {structuralPrior && ` + ${Math.round((1 - alpha) * 100)}% × ${Math.round(priorVS * 10) / 10}%`}
                    </span>
                    <span className="text-ink-300 mx-1">→</span>
                    <span className="font-bold" style={{ color: c.color }}>{proj}%</span>
                    <span className="text-ink-300 text-xs">（{ci[0]}–{ci[1]}%）</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-ink-400 mt-2">
              未表態 {Math.max(0, Math.round((100 - agg.declaredTotal) * 10) / 10)}%，其中 60% 按比例分配，40% 歸棄票/小黨
            </p>
          </section>

          {/* ── House Weight 說明 ── */}
          <section>
            <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-2">
              民調機構權重（基於歷史準確率驗證）
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '聯合報',   w: '×1.8', note: '2024最準 0.52%' },
                { label: 'TVBS',    w: '×1.5', note: '2024次準 3.61%' },
                { label: '菱傳媒',  w: '×1.2', note: '2022地方最準' },
                { label: '美麗島',  w: '×1.0', note: '中性' },
                { label: 'ETtoday', w: '×1.0', note: '中性' },
                { label: '山水',    w: '×1.0', note: '中性' },
                { label: '趨勢民調',w: '×0.9', note: '規模較小' },
                { label: '其他',    w: '×0.8', note: '預設' },
              ].map(({ label, w, note }) => (
                <div key={label} className="flex flex-col items-center text-center px-2.5 py-1.5 bg-ink-50 border border-ink-100 text-ink-600 rounded-lg">
                  <span className="text-xs font-bold font-mono">{label}</span>
                  <span className="text-xs font-mono font-bold text-amber-700">{w}</span>
                  <span className="text-[10px] text-ink-400">{note}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-0.5 text-xs text-ink-400">
              <p>加法偏差修正：三立 / 自由時報 DPP +2pp（2022 驗證）；其他機構暫設 0。</p>
              <p>完整公式：w = √(n/1000) × e^(−d/21) × house_weight，並對民調數字套用加法偏差。</p>
              <p className="text-amber-600">校準來源：tstm.tw 選後民調大檢驗（2024）、vocus.cc 2022縣市長民調驗證。</p>
            </div>
          </section>

        </div>
      )}
    </div>
  )
}
