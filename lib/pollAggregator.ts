import { ElectionPoll, ElectionCandidate } from '@/types'

/**
 * 加權民調聚合
 *
 * 權重公式：w_i = sqrt(n_i / 1000) × exp(-d_i / 21)
 *   n_i：樣本數（預設 1000）
 *   d_i：距今天數（半衰期 21 天，3 週前的民調權重約 37%）
 *
 * 勝率估算：
 *   各候選人加權平均支持度，再做正規化 → 相對勝率
 *   (非嚴格貝葉斯模型，為簡化版本)
 */
export function aggregatePolls(
  polls: ElectionPoll[],
  candidates: ElectionCandidate[]
) {
  if (polls.length === 0) return null

  const now = new Date()
  const sums: Record<string, number> = {}
  const weights: Record<string, number> = {}

  candidates.forEach((c) => {
    sums[c.name] = 0
    weights[c.name] = 0
  })

  polls.forEach((poll) => {
    const daysAgo =
      (now.getTime() - new Date(poll.date).getTime()) / (1000 * 60 * 60 * 24)
    const recency = Math.exp(-daysAgo / 21)
    const size = Math.sqrt((poll.sampleSize ?? 1000) / 1000)
    const w = recency * size

    poll.results.forEach((r) => {
      if (sums[r.name] !== undefined) {
        sums[r.name] += w * r.percentage
        weights[r.name] += w
      }
    })
  })

  // 加權平均支持度
  const avgPct: Record<string, number> = {}
  candidates.forEach((c) => {
    avgPct[c.name] =
      weights[c.name] > 0 ? sums[c.name] / weights[c.name] : 0
  })

  // 正規化為相對勝率
  const total = Object.values(avgPct).reduce((a, b) => a + b, 0)
  const winProb: Record<string, number> = {}
  candidates.forEach((c) => {
    winProb[c.name] =
      total > 0 ? Math.round((avgPct[c.name] / total) * 1000) / 10 : 0
  })

  // 四捨五入平均支持度到小數一位
  candidates.forEach((c) => {
    avgPct[c.name] = Math.round(avgPct[c.name] * 10) / 10
  })

  const leader = candidates.reduce((a, b) =>
    (winProb[a.name] ?? 0) >= (winProb[b.name] ?? 0) ? a : b
  )

  return { avgPct, winProb, leader, pollCount: polls.length }
}

/** 把民調清單轉為 recharts 可用的時間序列格式 */
export function buildTrendData(
  polls: ElectionPoll[],
  candidates: ElectionCandidate[]
) {
  const sorted = [...polls].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((poll) => {
    const row: Record<string, string | number> = { date: poll.date, source: poll.source }
    candidates.forEach((c) => {
      const r = poll.results.find((x) => x.name === c.name)
      row[c.name] = r?.percentage ?? 0
    })
    return row
  })
}
