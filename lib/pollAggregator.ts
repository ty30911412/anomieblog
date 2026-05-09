import { ElectionPoll, ElectionCandidate, IncumbencyStatus } from '@/types'

/**
 * 加權民調聚合 — 整合四項學術改進
 *
 * 理論依據：
 *   - Linzer (2013, JASA)：動態貝葉斯模型，α 應以「距選舉日天數」為函數
 *   - Silver / FiveThirtyEight：House Effect 分離「權重」與「加法偏差修正」
 *   - Yu & Lim (2021)：台灣縣市長選舉的現任者劣勢 (-2~4%)
 *   - Graefe et al. (2014)：民調聚合在選前最後 90 天才明顯優於基本面模型
 *
 * 四項改進：
 *   1. α 時間函數：結合民調數量與距選舉日天數（logistic 曲線）
 *   2. House Effect：分離乘法權重（準確率）與加法偏差修正（系統誤差）
 *   3. 現任者效應：依 incumbencyStatus 調整結構先驗
 *   4. 不確定性量化：回傳標準差與 95% 信賴區間
 */

// ── 1. House Effect：乘法權重（準確率代理） ──────────────────────────────────
// 資料來源：tsjh301 方法論 + 台灣媒體民調歷史準確率評估
const HOUSE_WEIGHTS: Record<string, number> = {
  'TVBS':          2.0,
  'TVBS民調中心':   2.0,
  '美麗島':         1.0,
  '美麗島電子報':   1.0,
  '美麗島民調':     1.0,
  'ETtoday':       1.0,
  'ETtoday民調雲':  1.0,
  '山水':           1.0,
  '山水民意':       1.0,
  '震傳媒':         1.0,
  '趨勢民調':       0.8,
  '聯合報':         0.8,
}

// ── 2. House Effect：加法偏差修正（正值 = 此機構高估該黨，百分點） ───────────
// 初期因台灣歷史驗證資料有限，設 0（無偏假設）；選後可依誤差逐步校準
// 範例（有驗證資料後填入）：
//   'TVBS':   { KMT: +1.5, DPP: -1.5 }
//   '美麗島': { KMT: -1.0, DPP: +1.0 }
const HOUSE_BIAS: Record<string, Partial<Record<'KMT' | 'DPP', number>>> = {}

// ── 3. 現任者效應調整（百分點，加法） ────────────────────────────────────────
// 根據 Yu & Lim (2021) 台灣縣市長選舉文獻
// 調整施於「結構先驗」而非民調聚合值
const INCUMBENCY_ADJUSTMENT: Record<IncumbencyStatus, number> = {
  incumbent:       -3.0,   // 現任者劣勢：台灣文獻中位數約 -3pp
  party_successor: -1.5,   // 接班人折扣：繼承執政包袱但非現任者本人
  challenger:       0.0,   // 挑戰方：無調整
}

function getHouseWeight(source: string): number {
  for (const [key, w] of Object.entries(HOUSE_WEIGHTS)) {
    if (source.includes(key)) return w
  }
  return 0.8
}

function getHouseBias(source: string, label: 'KMT' | 'DPP'): number {
  for (const [key, bias] of Object.entries(HOUSE_BIAS)) {
    if (source.includes(key)) return bias[label] ?? 0
  }
  return 0
}

function partyLabel(party: string): 'KMT' | 'DPP' {
  if (party.includes('國民黨') || party === 'KMT') return 'KMT'
  return 'DPP'
}

// ── α 計算：Linzer (2013) 時間函數 + 民調數量 ──────────────────────────────
// α 決定最終預測中「民調」vs「結構先驗」的比重，兩因子取最大值
//
// timeFactor：logistic 曲線，以選前 90 天為基準點（0.5）
//   200 天前 ≈ 0.02  →  幾乎全靠結構先驗
//    90 天前 ≈ 0.50  →  各半
//    30 天前 ≈ 0.88  →  強烈依賴民調
//     0 天   = 1.00  →  完全依賴民調
//
// pollFactor：min(1, polls/6)，6 筆以上民調時完全信任民調
function computeAlpha(pollCount: number, electionDate: string): number {
  const daysToElection = Math.max(
    0,
    (new Date(electionDate).getTime() - Date.now()) / 86400000
  )
  const pollFactor = Math.min(1, pollCount / 6)
  const timeFactor = daysToElection === 0
    ? 1.0
    : 1 / (1 + Math.exp((daysToElection - 90) / 30))
  return Math.min(1, Math.max(pollFactor, timeFactor))
}

// ── 不確定性計算 ─────────────────────────────────────────────────────────────
// 若近 90 天民調 < 2 筆：以抽樣誤差估算（n=1000 預設）
// 若近 90 天民調 ≥ 2 筆：機構間標準差（反映民調分歧程度）
function computeUncertainty(
  polls: ElectionPoll[],
  candidateName: string,
  avgPct: number
): number {
  const recent = polls
    .filter((p) => (Date.now() - new Date(p.date).getTime()) / 86400000 <= 90)
    .map((p) => p.results.find((r) => r.name === candidateName)?.percentage)
    .filter((v): v is number => v !== undefined)

  if (recent.length < 2) {
    // 抽樣誤差：95% CI 半寬 = √(p(1-p)/n) × 1.96，n=1000
    const p = Math.min(Math.max((avgPct ?? 40) / 100, 0.01), 0.99)
    return Math.round(Math.sqrt((p * (1 - p)) / 1000) * 196) / 10
  }

  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

// ── 主要匯出介面 ─────────────────────────────────────────────────────────────

export interface AggregationResult {
  /** 加權平均民調支持度（原始民調數字，已做 House Bias 修正） */
  avgPct: Record<string, number>
  /** 正規化相對勝率（純民調，無結構先驗） */
  winProb: Record<string, number>
  /** 最終預測勝率（民調 + 結構先驗 + 現任者效應，正規化至 100%） */
  predictedProb: Record<string, number>
  /** 民調的 95% 不確定性半寬（百分點） */
  uncertainty: Record<string, number>
  /** 民調的 95% 信賴區間 [下界, 上界]（百分點） */
  confidenceInterval: Record<string, [number, number]>

  // ── 得票率預測（Vote Share Forecast）──────────────────────────────────────
  // 與勝率不同：得票率是絕對值，不正規化至 100%
  // 方法：民調調整（未表態比例分配）× α + 結構先驗得票率 × (1-α)
  // 參考：Jennings & Wlezien (2016), Yu & Lim (2021), Abramowitz (2012)

  /** 民調調整後的預測得票率（含未表態按比例分配 60%） */
  pollVoteShare: Record<string, number>
  /** 最終預測得票率（混合民調 + 2022 結構先驗，未正規化） */
  projectedVoteShare: Record<string, number>
  /** 得票率 90% 預測區間 [低, 高]（比勝率 CI 更寬：不確定性 × 2.5） */
  voteShareCI: Record<string, [number, number]>
  /** 民調中明確表態的比例總和（100 − 未表態） */
  declaredTotal: number

  leader: ElectionCandidate
  pollCount: number
  /** 民調在最終預測中的權重（0–1），由時間 + 筆數動態決定 */
  pollWeight: number
  /** 距選舉日天數（整數） */
  daysToElection: number
}

export function aggregatePolls(
  polls: ElectionPoll[],
  candidates: ElectionCandidate[],
  /** 2022 得票率作為選民結構基準，例如 { '蔣萬安': 62.0, '陳時中': 31.0 } */
  structuralPrior?: Record<string, number>,
  /** 選舉日期（用於 α 時間函數），格式 'YYYY-MM-DD' */
  electionDate?: string
): AggregationResult | null {
  if (polls.length === 0) return null

  const now = new Date()
  const targetDate = electionDate ?? '2026-11-28'
  const sums: Record<string, number> = {}
  const totalW: Record<string, number> = {}
  candidates.forEach((c) => { sums[c.name] = 0; totalW[c.name] = 0 })

  // ── 加權聚合（含加法 House Bias 修正） ──
  polls.forEach((poll) => {
    const daysAgo = (now.getTime() - new Date(poll.date).getTime()) / 86400000
    const recency = Math.exp(-daysAgo / 21)
    const sizeW   = Math.sqrt((poll.sampleSize ?? 1000) / 1000)
    const houseW  = getHouseWeight(poll.source)
    const w = recency * sizeW * houseW

    poll.results.forEach((r) => {
      if (sums[r.name] === undefined) return
      const cand = candidates.find((c) => c.name === r.name)
      const bias = cand ? getHouseBias(poll.source, partyLabel(cand.party)) : 0
      sums[r.name] += w * (r.percentage - bias)
      totalW[r.name] += w
    })
  })

  // ── 加權平均 ──
  const avgPct: Record<string, number> = {}
  candidates.forEach((c) => {
    avgPct[c.name] = totalW[c.name] > 0
      ? Math.round((sums[c.name] / totalW[c.name]) * 10) / 10
      : 0
  })

  // ── 不確定性與信賴區間 ──
  const uncertainty: Record<string, number> = {}
  const confidenceInterval: Record<string, [number, number]> = {}
  candidates.forEach((c) => {
    const u = computeUncertainty(polls, c.name, avgPct[c.name])
    uncertainty[c.name] = u
    confidenceInterval[c.name] = [
      Math.max(0, Math.round((avgPct[c.name] - u * 1.96) * 10) / 10),
      Math.min(100, Math.round((avgPct[c.name] + u * 1.96) * 10) / 10),
    ]
  })

  // ── 純民調勝率（正規化） ──
  const pollTotal = Object.values(avgPct).reduce((a, b) => a + b, 0)
  const winProb: Record<string, number> = {}
  candidates.forEach((c) => {
    winProb[c.name] = pollTotal > 0
      ? Math.round((avgPct[c.name] / pollTotal) * 1000) / 10
      : 0
  })

  // ── α：時間函數 + 民調數量（Linzer 2013） ──
  const alpha = computeAlpha(polls.length, targetDate)
  const daysToElection = Math.round(
    Math.max(0, (new Date(targetDate).getTime() - now.getTime()) / 86400000)
  )

  // ── 最終預測：民調 + 結構先驗（含現任者效應） ──
  const predictedProb: Record<string, number> = {}

  if (structuralPrior) {
    // 步驟 1：正規化結構先驗
    const priorTotal = Object.values(structuralPrior).reduce((a, b) => a + b, 0)
    const normalizedPrior: Record<string, number> = {}
    candidates.forEach((c) => {
      normalizedPrior[c.name] = priorTotal > 0
        ? (structuralPrior[c.name] ?? 0) / priorTotal * 100
        : 0
    })

    // 步驟 2：套用現任者效應（調整結構先驗）
    const adjustedPrior: Record<string, number> = {}
    candidates.forEach((c) => {
      const status = c.incumbencyStatus ?? 'challenger'
      adjustedPrior[c.name] = normalizedPrior[c.name] + INCUMBENCY_ADJUSTMENT[status]
    })

    // 步驟 3：重新正規化調整後先驗
    const adjTotal = Object.values(adjustedPrior).reduce((a, b) => a + b, 0)
    const renormPrior: Record<string, number> = {}
    candidates.forEach((c) => {
      renormPrior[c.name] = adjTotal > 0
        ? adjustedPrior[c.name] / adjTotal * 100
        : normalizedPrior[c.name]
    })

    // 步驟 4：混合（α 加權）
    candidates.forEach((c) => {
      predictedProb[c.name] = Math.round(
        (alpha * winProb[c.name] + (1 - alpha) * renormPrior[c.name]) * 10
      ) / 10
    })

    // 步驟 5：正規化確保總和 100
    const predTotal = Object.values(predictedProb).reduce((a, b) => a + b, 0)
    if (predTotal > 0) {
      candidates.forEach((c) => {
        predictedProb[c.name] = Math.round((predictedProb[c.name] / predTotal) * 1000) / 10
      })
    }
  } else {
    // 無結構先驗時，現任者效應直接套在民調勝率上
    const adjusted: Record<string, number> = {}
    candidates.forEach((c) => {
      const status = c.incumbencyStatus ?? 'challenger'
      adjusted[c.name] = winProb[c.name] + INCUMBENCY_ADJUSTMENT[status]
    })
    const adjTotal = Object.values(adjusted).reduce((a, b) => a + b, 0)
    candidates.forEach((c) => {
      predictedProb[c.name] = adjTotal > 0
        ? Math.round((adjusted[c.name] / adjTotal) * 1000) / 10
        : winProb[c.name]
    })
  }

  const leader = candidates.reduce((a, b) =>
    (predictedProb[a.name] ?? 0) >= (predictedProb[b.name] ?? 0) ? a : b
  )

  // ── 得票率預測（Vote Share Forecast） ────────────────────────────────────
  //
  // 步驟 1：計算民調中明確表態的加總
  //   台灣縣市長民調通常有 15–25% 未表態／拒答；這些人選舉日多數仍按政黨認同投票
  //   策略：將未表態的 60% 按現有民調比例分配（其餘 40% 歸棄票/小黨）
  //   根據：Jennings & Wlezien 2016（45 國實證），Yi & Lim 2021（台灣本土）
  //
  const declaredTotal = Object.values(avgPct).reduce((a, b) => a + b, 0)
  const undecidedShare = Math.max(0, 100 - declaredTotal)

  // 步驟 2：民調調整得票率（poll_vote_share）
  const pollVoteShare: Record<string, number> = {}
  candidates.forEach((c) => {
    const proportionalAlloc = declaredTotal > 0
      ? undecidedShare * 0.6 * (avgPct[c.name] / declaredTotal)
      : 0
    pollVoteShare[c.name] = Math.round((avgPct[c.name] + proportionalAlloc) * 10) / 10
  })

  // 步驟 3：結構先驗得票率（raw 2022 得票率，含現任者效應，但不正規化到 100%）
  //   與勝率預測的差異：得票率用原始數字（e.g., 蔣 62%），不是正規化後的 winShare
  //   現任者效應仍然套用（-3pp / -1.5pp），但在原始空間而非正規化空間
  const priorVoteShare: Record<string, number> = {}
  if (structuralPrior) {
    candidates.forEach((c) => {
      const status = c.incumbencyStatus ?? 'challenger'
      priorVoteShare[c.name] = (structuralPrior[c.name] ?? pollVoteShare[c.name])
        + INCUMBENCY_ADJUSTMENT[status]
    })
  } else {
    candidates.forEach((c) => { priorVoteShare[c.name] = pollVoteShare[c.name] })
  }

  // 步驟 4：混合（同一個 α）
  const projectedVoteShare: Record<string, number> = {}
  candidates.forEach((c) => {
    projectedVoteShare[c.name] = Math.round(
      (alpha * pollVoteShare[c.name] + (1 - alpha) * priorVoteShare[c.name]) * 10
    ) / 10
  })

  // 步驟 5：得票率 90% 預測區間
  //   得票率 CI 比勝率更寬：
  //   - 不確定性乘以 2.5（vs 勝率的 1.96），反映絕對值預測誤差更大
  //   - 台灣 2018/2022 縣市長民調 MAE 約 ±3–5pp，加上選民結構轉移風險
  const voteShareCI: Record<string, [number, number]> = {}
  candidates.forEach((c) => {
    const u = uncertainty[c.name] ?? 3.0
    const margin = Math.round(u * 2.5 * 10) / 10
    voteShareCI[c.name] = [
      Math.max(0, Math.round((projectedVoteShare[c.name] - margin) * 10) / 10),
      Math.min(100, Math.round((projectedVoteShare[c.name] + margin) * 10) / 10),
    ]
  })

  return {
    avgPct,
    winProb,
    predictedProb,
    uncertainty,
    confidenceInterval,
    pollVoteShare,
    projectedVoteShare,
    voteShareCI,
    declaredTotal: Math.round(declaredTotal * 10) / 10,
    leader,
    pollCount: polls.length,
    pollWeight: alpha,
    daysToElection,
  }
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

/** 計算各機構間標準差，供外部 UI 使用 */
export function pollUncertainty(
  polls: ElectionPoll[],
  candidateName: string
): number {
  const recent = polls
    .filter((p) => (Date.now() - new Date(p.date).getTime()) / 86400000 <= 60)
    .map((p) => p.results.find((r) => r.name === candidateName)?.percentage ?? null)
    .filter((v): v is number => v !== null)

  if (recent.length < 2) return 0
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}
