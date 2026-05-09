import { ElectionPoll, ElectionCandidate } from '@/types'

/**
 * 加權民調聚合 — 借鑑「無情真實的未來預測」方法論
 *
 * 權重來源：
 *   1. 機構效應 (House Effect)：各機構依歷史準確率給予加權
 *      TVBS × 2.0、美麗島 × 1.0、ETtoday × 1.0、山水 × 1.0、其他 × 0.8
 *   2. 樣本數：√(n / 1000)，大樣本獲得較高權重
 *   3. 時間衰減：exp(-d / 21)，半衰期 21 天
 *
 * 最終預測：
 *   若有 2022 選民結構基準，則混合民調聚合與結構基準：
 *   prediction = α × poll_avg + (1-α) × structural_prior
 *   α = min(1, pollCount / 6)，民調越多 α 越大（趨向完全信任民調）
 *
 * 參考：https://tsjh301.blogspot.com/
 */

/** 各民調機構的歷史準確率加權係數 */
const HOUSE_WEIGHTS: Record<string, number> = {
  'TVBS': 2.0,
  'TVBS民調中心': 2.0,
  '美麗島': 1.0,
  '美麗島電子報': 1.0,
  '美麗島民調': 1.0,
  'ETtoday': 1.0,
  'ETtoday民調雲': 1.0,
  '山水': 1.0,
  '山水民意': 1.0,
  '震傳媒': 1.0,
  '趨勢民調': 0.8,
  '聯合報': 0.8,
}

function getHouseWeight(source: string): number {
  // 模糊匹配：來源名稱包含關鍵字即可
  for (const [key, w] of Object.entries(HOUSE_WEIGHTS)) {
    if (source.includes(key)) return w
  }
  return 0.8
}

export interface AggregationResult {
  /** 加權平均民調支持度 */
  avgPct: Record<string, number>
  /** 正規化相對勝率（純民調聚合） */
  winProb: Record<string, number>
  /** 混合選民結構後的預測勝率（若有 structuralPrior） */
  predictedProb: Record<string, number>
  leader: ElectionCandidate
  pollCount: number
  /** 民調在最終預測中的權重（0–1） */
  pollWeight: number
}

export function aggregatePolls(
  polls: ElectionPoll[],
  candidates: ElectionCandidate[],
  /** 2022 得票率作為選民結構基準，例如 { '蔣萬安': 62.0, '陳時中': 31.0 } */
  structuralPrior?: Record<string, number>
): AggregationResult | null {
  if (polls.length === 0) return null

  const now = new Date()
  const sums: Record<string, number> = {}
  const totalW: Record<string, number> = {}
  candidates.forEach((c) => { sums[c.name] = 0; totalW[c.name] = 0 })

  polls.forEach((poll) => {
    const daysAgo = (now.getTime() - new Date(poll.date).getTime()) / 86400000
    const recency = Math.exp(-daysAgo / 21)
    const sizeW  = Math.sqrt((poll.sampleSize ?? 1000) / 1000)
    const houseW = getHouseWeight(poll.source)
    const w = recency * sizeW * houseW

    poll.results.forEach((r) => {
      if (sums[r.name] !== undefined) {
        sums[r.name] += w * r.percentage
        totalW[r.name] += w
      }
    })
  })

  // 加權平均
  const avgPct: Record<string, number> = {}
  candidates.forEach((c) => {
    avgPct[c.name] = totalW[c.name] > 0
      ? Math.round((sums[c.name] / totalW[c.name]) * 10) / 10
      : 0
  })

  // 純民調勝率（正規化）
  const pollTotal = Object.values(avgPct).reduce((a, b) => a + b, 0)
  const winProb: Record<string, number> = {}
  candidates.forEach((c) => {
    winProb[c.name] = pollTotal > 0
      ? Math.round((avgPct[c.name] / pollTotal) * 1000) / 10
      : 0
  })

  // 混合預測勝率（民調 + 選民結構基準）
  // α = min(1, pollCount / 6)：有 6 筆以上民調時完全信任民調
  const alpha = Math.min(1, polls.length / 6)
  const predictedProb: Record<string, number> = {}

  if (structuralPrior) {
    const priorTotal = Object.values(structuralPrior).reduce((a, b) => a + b, 0)
    candidates.forEach((c) => {
      const priorPct = priorTotal > 0 ? (structuralPrior[c.name] ?? 0) / priorTotal * 100 : 0
      const blended = alpha * winProb[c.name] + (1 - alpha) * priorPct
      predictedProb[c.name] = Math.round(blended * 10) / 10
    })
    // 重新正規化
    const predTotal = Object.values(predictedProb).reduce((a, b) => a + b, 0)
    if (predTotal > 0) {
      candidates.forEach((c) => {
        predictedProb[c.name] = Math.round((predictedProb[c.name] / predTotal) * 1000) / 10
      })
    }
  } else {
    candidates.forEach((c) => { predictedProb[c.name] = winProb[c.name] })
  }

  const leader = candidates.reduce((a, b) =>
    (predictedProb[a.name] ?? 0) >= (predictedProb[b.name] ?? 0) ? a : b
  )

  return { avgPct, winProb, predictedProb, leader, pollCount: polls.length, pollWeight: alpha }
}

/** recharts 折線圖時間序列資料 */
export function buildTrendData(
  polls: ElectionPoll[],
  candidates: ElectionCandidate[]
) {
  const sorted = [...polls].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((poll) => {
    const row: Record<string, string | number> = {
      date: poll.date,
      source: poll.source,
    }
    candidates.forEach((c) => {
      const r = poll.results.find((x) => x.name === c.name)
      row[c.name] = r?.percentage ?? 0
    })
    return row
  })
}

/** 計算各機構間的標準差（民調分散程度），用於顯示不確定性 */
export function pollUncertainty(
  polls: ElectionPoll[],
  candidateName: string
): number {
  const recent = polls
    .filter((p) => {
      const days = (Date.now() - new Date(p.date).getTime()) / 86400000
      return days <= 60
    })
    .map((p) => p.results.find((r) => r.name === candidateName)?.percentage ?? null)
    .filter((v): v is number => v !== null)

  if (recent.length < 2) return 0
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}
