'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ElectionCandidate } from '@/types'

interface Props {
  data: Record<string, string | number>[]
  candidates: ElectionCandidate[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-ink-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-ink-600 mb-2 font-mono">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-ink-700">{p.name}</span>
          <span className="font-bold font-mono ml-auto pl-4">{p.value}%</span>
        </div>
      ))}
      {payload[0]?.payload?.source && (
        <p className="text-ink-300 text-xs mt-2 border-t border-ink-100 pt-2">
          來源：{payload[0].payload.source}
        </p>
      )}
    </div>
  )
}

export default function PollTrendChart({ data, candidates }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-300 text-sm">
        尚無民調數據
      </div>
    )
  }

  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-ink-400">
        <p className="text-sm">目前僅一筆民調，無法繪製走勢圖</p>
        <p className="text-xs font-mono text-ink-300">{data[0].date} · {String(data[0].source)}</p>
      </div>
    )
  }

  // 動態 Y 軸上限：資料最大值 + 8pp，最低 40，最高 100
  const rawMax = Math.max(
    ...data.flatMap((row) => candidates.map((c) => Number(row[c.name] ?? 0)))
  )
  const yMax = Math.min(100, Math.ceil((rawMax + 8) / 5) * 5)
  const yMin = 0

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#8b7e6a' }}
          tickLine={false}
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: '#8b7e6a' }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-ink-600">{value}</span>
          )}
        />
        {candidates.map((c) => (
          <Line
            key={c.name}
            type="monotone"
            dataKey={c.name}
            stroke={c.color}
            strokeWidth={2.5}
            dot={{ r: 4, fill: c.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
