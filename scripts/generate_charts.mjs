// node scripts/generate_charts.mjs
// 為五篇社會科學文章生成 SVG 圖表並插入 draft markdown 檔案

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const draftsDir = join(__dir, '..', 'drafts')

// ── 共用工具 ──────────────────────────────────────
const AMBER = '#BA7517'
const AMBER_LIGHT = '#FAC775'
const INK = '#3C3C3A'
const INK_MID = '#5F5E5A'
const INK_LIGHT = '#B4B2A9'
const TEAL = '#1D9E75'
const PURPLE = '#534AB7'
const RED = '#D85A30'
const GRAY_FILLS = ['#D3D1C7', '#B4B2A9', '#888780', '#5F5E5A', AMBER]

function sourceNote(text) {
  return `<text x="300" y="292" text-anchor="middle" font-size="11" fill="${INK_LIGHT}" font-family="sans-serif">資料來源：${text}</text>`
}

function axis(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK_LIGHT}" stroke-width="1"/>`
}

function gridLine(y) {
  return `<line x1="60" y1="${y}" x2="560" y2="${y}" stroke="${INK_LIGHT}" stroke-width="0.5" stroke-dasharray="3,3"/>`
}

// ── Chart 1：TFR 折線圖 ──────────────────────────
function chartTFR() {
  // chart area: x[60,560] y[30,230], yScale: 0–2.5
  const W = 500, H = 200, X0 = 60, Y0 = 230
  const data = [
    [1984,2.06],[1989,1.90],[1994,1.76],[1999,1.56],[2004,1.18],
    [2009,1.03],[2010,0.90],[2013,1.07],[2016,1.17],[2019,1.05],
    [2021,0.98],[2023,0.90],[2024,0.87]
  ]
  const minYear = 1984, maxYear = 2024, yMax = 2.5

  function cx(yr) { return X0 + (yr - minYear) / (maxYear - minYear) * W }
  function cy(v)  { return Y0 - (v / yMax) * H }

  // Y gridlines & labels
  const yTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5]
  const grids = yTicks.map(v => `${gridLine(cy(v))}
    <text x="52" y="${cy(v)+4}" text-anchor="end" font-size="11" fill="${INK_MID}" font-family="sans-serif">${v}</text>`).join('')

  // Replacement threshold line
  const repY = cy(2.1)
  const repLine = `<line x1="${X0}" y1="${repY}" x2="560" y2="${repY}" stroke="#E24B4A" stroke-width="1" stroke-dasharray="5,4" opacity="0.7"/>`
  const repLabel = `<text x="564" y="${repY+4}" font-size="10" fill="#E24B4A" font-family="sans-serif">替換率 2.1</text>`

  // X axis labels
  const xLabels = [1984,1990,1995,2000,2005,2010,2015,2020,2024]
    .map(yr => `<text x="${cx(yr)}" y="${Y0+16}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif">${yr}</text>`)
    .join('')

  // Area fill
  const pts = data.map(([yr,v]) => `${cx(yr).toFixed(1)},${cy(v).toFixed(1)}`).join(' ')
  const firstX = cx(1984), lastX = cx(2024)
  const area = `<polygon points="${pts} ${lastX},${Y0} ${firstX},${Y0}" fill="${AMBER}" opacity="0.1"/>`

  // Polyline
  const line = `<polyline points="${pts}" fill="none" stroke="${AMBER}" stroke-width="2.5" stroke-linejoin="round"/>`

  // Dots
  const dots = data.map(([yr,v]) =>
    `<circle cx="${cx(yr).toFixed(1)}" cy="${cy(v).toFixed(1)}" r="3.5" fill="${AMBER}"/>`).join('')

  // Endpoint label
  const [lastYr, lastV] = data[data.length-1]
  const endLabel = `<text x="${cx(lastYr)+8}" y="${cy(lastV)+4}" font-size="12" font-weight="bold" fill="${AMBER}" font-family="sans-serif">${lastV}</text>`

  return `<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="台灣總生育率 1984–2024 折線圖">
  <title>台灣總生育率 1984–2024</title>
  ${grids}
  ${axis(X0, Y0, 565, Y0)}
  ${axis(X0, 30, X0, Y0)}
  ${repLine}${repLabel}
  ${xLabels}
  <text x="20" y="${cy(1.25)}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif" transform="rotate(-90,20,${cy(1.25)})">總生育率（TFR）</text>
  ${area}${line}${dots}${endLabel}
  <text x="300" y="16" text-anchor="middle" font-size="13" font-weight="bold" fill="${INK}" font-family="sans-serif">台灣總生育率 1984–2024</text>
  ${sourceNote('內政部戶政司（2025）人口統計年刊')}
</svg>`
}

// ── Chart 2：財富差距橫向長條圖 ──────────────────
function chartWealth() {
  const data = [
    ['法國', 627.4],
    ['韓國', 140.1],
    ['英國', 109.5],
    ['澳洲', 93.1],
    ['台灣', 66.9],
  ]
  const maxVal = 660
  const barH = 26, barGap = 14
  const X0 = 70, Y0 = 40
  const W = 460 // chart width

  const bars = data.map(([country, val], i) => {
    const y = Y0 + i * (barH + barGap)
    const bw = (val / maxVal) * W
    const fill = country === '台灣' ? AMBER : GRAY_FILLS[i]
    const labelColor = country === '台灣' ? AMBER : INK_MID
    return `
    <rect x="${X0}" y="${y}" width="${bw.toFixed(1)}" height="${barH}" fill="${fill}" rx="3"/>
    <text x="${X0 - 6}" y="${y + barH/2 + 4}" text-anchor="end" font-size="12" fill="${INK}" font-family="sans-serif">${country}</text>
    <text x="${X0 + bw + 6}" y="${y + barH/2 + 4}" text-anchor="start" font-size="12" font-weight="bold" fill="${labelColor}" font-family="sans-serif">${val} 倍</text>`
  }).join('')

  // X axis ticks
  const xTicks = [0, 100, 200, 300, 400, 500, 600]
  const ticks = xTicks.map(v => {
    const x = X0 + (v / maxVal) * W
    return `<line x1="${x}" y1="${Y0}" x2="${x}" y2="${Y0 + 4*(barH+barGap) + barH + 4}" stroke="${INK_LIGHT}" stroke-width="0.5" stroke-dasharray="3,3"/>
    <text x="${x}" y="${Y0 + 4*(barH+barGap) + barH + 18}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif">${v}</text>`
  }).join('')

  return `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="各國最富20%與最貧20%家庭財富差距比較">
  <title>各國家庭財富差距比較（最富20% ÷ 最貧20%）</title>
  <text x="300" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="${INK}" font-family="sans-serif">家庭財富差距（最富20% ÷ 最貧20%）</text>
  ${ticks}${bars}
  <text x="300" y="${Y0 + 4*(barH+barGap) + barH + 34}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif">財富倍數</text>
  ${sourceNote('主計總處 112 年國富統計報告；OECD Wealth Distribution Database')}
</svg>`
}

// ── Chart 3：青少年心理健康 ───────────────────────
function chartYouthMH() {
  const data = [
    { label: '面臨情緒\n困擾', val: 37, color: RED },
    { label: '中重度\n情緒困擾', val: 17.7, color: '#E24B4A' },
    { label: '頻繁拒學\n念頭', val: 20.5, color: '#F09595' },
    { label: '睡眠\n不足', val: 47.9, color: INK_MID },
    { label: '向AI\n求助', val: 46.5, color: AMBER_LIGHT },
    { label: '向輔導室\n求助', val: 41.1, color: '#FAC775' },
  ]
  const barW = 58, barGap = 14
  const X0 = 30, Y_BASE = 220, yMax = 60
  const chartH = 180

  const bars = data.map(({ label, val, color }, i) => {
    const x = X0 + i * (barW + barGap)
    const bh = (val / yMax) * chartH
    const y = Y_BASE - bh
    const lines = label.split('\n')
    const labelY1 = Y_BASE + 14
    const labelY2 = Y_BASE + 26
    return `
    <rect x="${x}" y="${y.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" fill="${color}" rx="3"/>
    <text x="${x + barW/2}" y="${y - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="${INK}" font-family="sans-serif">${val}%</text>
    <text x="${x + barW/2}" y="${labelY1}" text-anchor="middle" font-size="10" fill="${INK}" font-family="sans-serif">${lines[0]}</text>
    <text x="${x + barW/2}" y="${labelY2}" text-anchor="middle" font-size="10" fill="${INK}" font-family="sans-serif">${lines[1] ?? ''}</text>`
  }).join('')

  // Y gridlines
  const yTicks = [0, 20, 40, 60]
  const grids = yTicks.map(v => {
    const y = Y_BASE - (v / yMax) * chartH
    return `${gridLine(y)}
    <text x="${X0 - 4}" y="${y+4}" text-anchor="end" font-size="11" fill="${INK_MID}" font-family="sans-serif">${v}%</text>`
  }).join('')

  const totalW = X0 + 6 * (barW + barGap) - barGap + 10
  const midX = totalW / 2

  // Legend
  const legend = `
  <rect x="${midX - 80}" y="254" width="12" height="12" fill="${RED}" rx="2"/>
  <text x="${midX - 64}" y="264" font-size="11" fill="${INK_MID}" font-family="sans-serif">心理健康症狀</text>
  <rect x="${midX + 10}" y="254" width="12" height="12" fill="${AMBER_LIGHT}" rx="2"/>
  <text x="${midX + 26}" y="264" font-size="11" fill="${INK_MID}" font-family="sans-serif">行為／求助</text>`

  return `<svg viewBox="0 0 ${totalW} 295" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="台灣國高中生心理健康統計 2025">
  <title>台灣國高中生心理健康統計（2025）</title>
  <text x="${midX}" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="${INK}" font-family="sans-serif">國高中生心理健康現況（2025）</text>
  ${grids}
  <line x1="${X0}" y1="${Y_BASE}" x2="${totalW - 10}" y2="${Y_BASE}" stroke="${INK_LIGHT}" stroke-width="1"/>
  ${bars}${legend}
  <text x="${midX}" y="285" text-anchor="middle" font-size="11" fill="${INK_LIGHT}" font-family="sans-serif">資料來源：兒童福利聯盟（2025）台灣青少年心理健康調查報告</text>
</svg>`
}

// ── Chart 4：未婚率折線圖 ─────────────────────────
function chartMarriage() {
  const data = [
    [1990,21.1],[1995,23.7],[2000,28.5],[2005,33.2],[2010,37.8],[2015,40.9],[2020,43.2]
  ]
  const X0 = 60, Y0 = 220, W = 480, H = 180
  const minYear = 1990, maxYear = 2020, yMin = 10, yMax = 55

  function cx(yr) { return X0 + (yr - minYear) / (maxYear - minYear) * W }
  function cy(v)  { return Y0 - (v - yMin) / (yMax - yMin) * H }

  const yTicks = [10, 20, 30, 40, 50]
  const grids = yTicks.map(v => `${gridLine(cy(v))}
    <text x="${X0-6}" y="${cy(v)+4}" text-anchor="end" font-size="11" fill="${INK_MID}" font-family="sans-serif">${v}%</text>`).join('')

  const xLabels = data.map(([yr]) =>
    `<text x="${cx(yr)}" y="${Y0+16}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif">${yr}</text>`).join('')

  const pts = data.map(([yr,v]) => `${cx(yr).toFixed(1)},${cy(v).toFixed(1)}`).join(' ')
  const firstX = cx(1990), lastX = cx(2020)
  const area = `<polygon points="${pts} ${lastX},${Y0} ${firstX},${Y0}" fill="${TEAL}" opacity="0.1"/>`
  const line = `<polyline points="${pts}" fill="none" stroke="${TEAL}" stroke-width="2.5" stroke-linejoin="round"/>`
  const dots = data.map(([yr,v]) =>
    `<circle cx="${cx(yr).toFixed(1)}" cy="${cy(v).toFixed(1)}" r="4" fill="${TEAL}"/>`).join('')

  const [lastYr, lastV] = data[data.length-1]
  const endLabel = `<text x="${cx(lastYr)+8}" y="${cy(lastV)+4}" font-size="12" font-weight="bold" fill="${TEAL}" font-family="sans-serif">${lastV}%</text>`

  return `<svg viewBox="0 0 620 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="台灣25至44歲適婚族群未婚率趨勢1990–2020">
  <title>台灣適婚族群（25–44歲）未婚率 1990–2020</title>
  <text x="310" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="${INK}" font-family="sans-serif">適婚族群（25–44歲）未婚率 1990–2020</text>
  ${grids}
  ${axis(X0, Y0, X0+W+5, Y0)}
  ${axis(X0, 30, X0, Y0)}
  ${xLabels}
  <text x="20" y="${cy(30)}" text-anchor="middle" font-size="11" fill="${INK_MID}" font-family="sans-serif" transform="rotate(-90,20,${cy(30)})">未婚率</text>
  ${area}${line}${dots}${endLabel}
  ${sourceNote('行政院主計總處人口及住宅普查；中央研究院家庭動態調查（2020）')}
</svg>`
}

// ── Chart 5：孤獨指數長條圖 ──────────────────────
function chartLoneliness() {
  const data = [
    { label: 'Z 世代\n(1997–)', val: 48.3, color: '#534AB7' },
    { label: '千禧世代\n(1981–96)', val: 45.3, color: '#7F77DD' },
    { label: 'X 世代\n(1965–80)', val: 45.1, color: '#AFA9EC' },
    { label: '嬰兒潮\n(1946–64)', val: 42.4, color: '#CECBF6' },
    { label: '最偉大\n世代', val: 38.6, color: '#EEEDFE' },
  ]
  const barW = 68, barGap = 18
  const X0 = 35, Y_BASE = 215, yMin = 30, yMax = 55
  const chartH = 170

  function bh(v) { return (v - yMin) / (yMax - yMin) * chartH }

  const bars = data.map(({ label, val, color }, i) => {
    const x = X0 + i * (barW + barGap)
    const h = bh(val)
    const y = Y_BASE - h
    const lines = label.split('\n')
    const textColor = i < 2 ? '#3C3489' : INK
    return `
    <rect x="${x}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" fill="${color}" rx="3" stroke="#CECBF6" stroke-width="0.5"/>
    <text x="${x + barW/2}" y="${y - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="${INK}" font-family="sans-serif">${val}</text>
    <text x="${x + barW/2}" y="${Y_BASE + 14}" text-anchor="middle" font-size="10" fill="${INK}" font-family="sans-serif">${lines[0]}</text>
    <text x="${x + barW/2}" y="${Y_BASE + 26}" text-anchor="middle" font-size="10" fill="${INK_MID}" font-family="sans-serif">${lines[1] ?? ''}</text>`
  }).join('')

  const yTicks = [30, 35, 40, 45, 50, 55]
  const grids = yTicks.map(v => {
    const y = Y_BASE - bh(v)
    return `${gridLine(y)}
    <text x="${X0 - 4}" y="${y+4}" text-anchor="end" font-size="11" fill="${INK_MID}" font-family="sans-serif">${v}</text>`
  }).join('')

  const totalW = X0 + 5 * (barW + barGap) - barGap + 10
  const midX = totalW / 2

  return `<svg viewBox="0 0 ${totalW} 295" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="各世代孤獨指數比較，Z世代最高">
  <title>各世代孤獨指數（Cigna 2018，滿分80分）</title>
  <text x="${midX}" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="${INK}" font-family="sans-serif">各世代孤獨指數（滿分 80 分）</text>
  ${grids}
  <line x1="${X0}" y1="${Y_BASE}" x2="${totalW - 5}" y2="${Y_BASE}" stroke="${INK_LIGHT}" stroke-width="1"/>
  ${bars}
  <text x="${midX}" y="285" text-anchor="middle" font-size="11" fill="${INK_LIGHT}" font-family="sans-serif">資料來源：Cigna U.S. Loneliness Index（2018）</text>
</svg>`
}

// ── 插入 SVG 至 markdown ─────────────────────────
function insertChart(filename, svgFn, insertAfter) {
  const path = join(draftsDir, filename)
  let content = readFileSync(path, 'utf-8')
  const svg = svgFn()
  const chartBlock = `\n\n<figure style="margin: 2rem 0">\n\n${svg}\n\n</figure>\n`

  if (content.includes(insertAfter)) {
    content = content.replace(insertAfter, insertAfter + chartBlock)
    writeFileSync(path, content, 'utf-8')
    console.log(`✅ 圖表已插入 ${filename}`)
  } else {
    console.warn(`⚠️  找不到插入點：${filename} — "${insertAfter.slice(0,40)}..."`)
  }
}

// ── 執行 ─────────────────────────────────────────
insertChart(
  'taiwan-low-fertility-sociology.md',
  chartTFR,
  '## 數字背後的故事'
)

insertChart(
  'taiwan-class-mobility-sociology.md',
  chartWealth,
  '## 數字先說話'
)

insertChart(
  'taiwan-youth-mental-health.md',
  chartYouthMH,
  '## 數字告訴我們的事'
)

insertChart(
  'taiwan-marriage-gender.md',
  chartMarriage,
  '## 女性離婚姻更遠'
)

insertChart(
  'social-media-loneliness.md',
  chartLoneliness,
  '## 孤獨，是全球公衛危機'
)

console.log('\n🎉 全部完成！可執行 node publish_batch.mjs 發布。')
