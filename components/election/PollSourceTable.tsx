'use client'

import { ElectionPoll, ElectionCandidate } from '@/types'
import { ExternalLink } from 'lucide-react'

interface Props {
  polls: ElectionPoll[]
  candidates: ElectionCandidate[]
}

export default function PollSourceTable({ polls, candidates }: Props) {
  const sorted = [...polls].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-50 border-b border-ink-200">
            <th className="text-left px-4 py-3 font-bold text-ink-600 text-xs uppercase tracking-wide whitespace-nowrap">日期</th>
            <th className="text-left px-4 py-3 font-bold text-ink-600 text-xs uppercase tracking-wide whitespace-nowrap">民調機構</th>
            {candidates.map((c) => (
              <th
                key={c.name}
                className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap"
                style={{ color: c.color }}
              >
                {c.name}
              </th>
            ))}
            <th className="text-right px-4 py-3 font-bold text-ink-600 text-xs uppercase tracking-wide whitespace-nowrap">樣本數</th>
            <th className="text-right px-4 py-3 font-bold text-ink-600 text-xs uppercase tracking-wide whitespace-nowrap">誤差</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {sorted.map((poll) => (
            <tr key={poll.id} className="hover:bg-ink-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-ink-500 text-xs whitespace-nowrap">{poll.date}</td>
              <td className="px-4 py-3 text-ink-700 whitespace-nowrap">{poll.source}</td>
              {candidates.map((c) => {
                const r = poll.results.find((x) => x.name === c.name)
                return (
                  <td key={c.name} className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap" style={{ color: c.color }}>
                    {r ? `${r.percentage}%` : '—'}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-right text-ink-400 font-mono text-xs whitespace-nowrap">
                {poll.sampleSize ? poll.sampleSize.toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-right text-ink-400 font-mono text-xs whitespace-nowrap">
                {poll.marginOfError ? `±${poll.marginOfError}%` : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                {poll.url && (
                  <a
                    href={poll.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-300 hover:text-amber-600 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
