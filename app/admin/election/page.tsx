'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ElectionRace, ElectionPoll, ElectionCandidate } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react'

const PARTY_COLORS: Record<string, string> = {
  '民主進步黨': '#1b9431',
  '中國國民黨': '#000095',
  '台灣民眾黨': '#28C8C8',
  '無黨籍': '#888888',
}

const REGIONS = ['北部', '中部', '南部', '東部', '離島']

export default function ElectionAdminPage() {
  const { currentUser } = useAuth()
  const router = useRouter()
  const [races, setRaces] = useState<ElectionRace[]>([])
  const [polls, setPolls] = useState<ElectionPoll[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRace, setExpandedRace] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  // ── 新增選區表單 ──
  const [newRace, setNewRace] = useState({
    city: '', citySlug: '', region: '北部', electionDate: '2026-11-28', order: 10,
    candidates: [
      { name: '', party: '民主進步黨', color: '#1b9431' },
      { name: '', party: '中國國民黨', color: '#000095' },
    ] as ElectionCandidate[],
  })

  // ── 新增民調表單 ──
  const [newPoll, setNewPoll] = useState({
    raceId: '', source: '', date: '', sampleSize: '', marginOfError: '', url: '', notes: '',
    results: [] as { name: string; percentage: string }[],
  })

  useEffect(() => {
    if (!currentUser) { router.push('/admin'); return }
    fetchData()
  }, [currentUser])

  const fetchData = async () => {
    setLoading(true)
    const [rSnap, pSnap] = await Promise.all([
      getDocs(collection(db, 'electionRaces')),
      getDocs(collection(db, 'electionPolls')),
    ])
    const r = rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ElectionRace))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    setRaces(r)
    setPolls(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ElectionPoll)))
    setLoading(false)
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ── 儲存選區 ──
  const saveRace = async () => {
    if (!newRace.city || !newRace.citySlug) return flash('請填入縣市名稱與 slug')
    const data = {
      city: newRace.city,
      region: newRace.region,
      candidates: newRace.candidates.filter((c) => c.name),
      electionDate: newRace.electionDate,
      isActive: true,
      order: Number(newRace.order),
    }
    await setDoc(doc(db, 'electionRaces', newRace.citySlug), data)
    flash('✓ 選區已儲存')
    fetchData()
  }

  const deleteRace = async (id: string) => {
    if (!confirm(`確定刪除 ${id}？`)) return
    await deleteDoc(doc(db, 'electionRaces', id))
    fetchData()
  }

  // ── 儲存民調 ──
  const savePoll = async () => {
    if (!newPoll.raceId || !newPoll.source || !newPoll.date) return flash('請填入選區、來源與日期')
    const data = {
      raceId: newPoll.raceId,
      source: newPoll.source,
      date: newPoll.date,
      sampleSize: newPoll.sampleSize ? Number(newPoll.sampleSize) : null,
      marginOfError: newPoll.marginOfError ? Number(newPoll.marginOfError) : null,
      url: newPoll.url || null,
      notes: newPoll.notes || null,
      results: newPoll.results
        .filter((r) => r.name && r.percentage)
        .map((r) => ({ name: r.name, percentage: Number(r.percentage) })),
    }
    await addDoc(collection(db, 'electionPolls'), data)
    flash('✓ 民調已新增')
    setNewPoll({ raceId: newPoll.raceId, source: '', date: '', sampleSize: '', marginOfError: '', url: '', notes: '', results: newPoll.results.map((r) => ({ ...r, percentage: '' })) })
    fetchData()
  }

  const deletePoll = async (id: string) => {
    await deleteDoc(doc(db, 'electionPolls', id))
    fetchData()
  }

  const updateRaceForPoll = (raceId: string) => {
    const race = races.find((r) => r.id === raceId)
    setNewPoll((p) => ({
      ...p, raceId,
      results: race?.candidates.map((c) => ({ name: c.name, percentage: '' })) ?? [],
    }))
  }

  if (loading) return <div className="pt-28 text-center text-ink-400">載入中...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pt-28 min-h-screen">
      <h1 className="font-serif text-3xl font-bold text-ink-900 mb-2">選舉數據管理</h1>
      <p className="text-ink-400 text-sm mb-8">管理選區設定與民調數據</p>

      {msg && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-bold">
          {msg}
        </div>
      )}

      {/* ──────── 新增選區 ──────── */}
      <section className="bg-white border border-ink-200 rounded-2xl p-6 mb-8">
        <h2 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
          <Plus size={16} /> 新增選區
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="input" placeholder="縣市名稱（例：台北市）" value={newRace.city}
            onChange={(e) => setNewRace((p) => ({ ...p, city: e.target.value }))} />
          <input className="input" placeholder="Slug（例：taipei）" value={newRace.citySlug}
            onChange={(e) => setNewRace((p) => ({ ...p, citySlug: e.target.value }))} />
          <select className="input" value={newRace.region}
            onChange={(e) => setNewRace((p) => ({ ...p, region: e.target.value }))}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input className="input" type="date" value={newRace.electionDate}
            onChange={(e) => setNewRace((p) => ({ ...p, electionDate: e.target.value }))} />
          <input className="input col-span-2" type="number" placeholder="排序（數字越小越前面）"
            value={newRace.order}
            onChange={(e) => setNewRace((p) => ({ ...p, order: Number(e.target.value) }))} />
        </div>

        {/* 候選人 */}
        <p className="text-xs font-bold text-ink-500 uppercase tracking-wide mb-2">候選人</p>
        {newRace.candidates.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="姓名" value={c.name}
              onChange={(e) => {
                const cs = [...newRace.candidates]; cs[i] = { ...cs[i], name: e.target.value }
                setNewRace((p) => ({ ...p, candidates: cs }))
              }} />
            <select className="input w-36"
              value={c.party}
              onChange={(e) => {
                const cs = [...newRace.candidates]
                cs[i] = { ...cs[i], party: e.target.value, color: PARTY_COLORS[e.target.value] ?? '#888888' }
                setNewRace((p) => ({ ...p, candidates: cs }))
              }}>
              {Object.keys(PARTY_COLORS).map((p) => <option key={p}>{p}</option>)}
            </select>
            <input className="input w-24" type="color" value={c.color}
              onChange={(e) => {
                const cs = [...newRace.candidates]; cs[i] = { ...cs[i], color: e.target.value }
                setNewRace((p) => ({ ...p, candidates: cs }))
              }} />
          </div>
        ))}
        <button className="text-xs text-ink-400 hover:text-ink-700 mb-4"
          onClick={() => setNewRace((p) => ({ ...p, candidates: [...p.candidates, { name: '', party: '無黨籍', color: '#888888' }] }))}>
          + 新增候選人
        </button>
        <br />
        <button onClick={saveRace}
          className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-white rounded-lg text-sm font-bold hover:bg-ink-700 transition-colors">
          <Save size={14} /> 儲存選區
        </button>
      </section>

      {/* ──────── 現有選區 ──────── */}
      <section className="mb-10">
        <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">現有選區</h2>
        {races.length === 0 ? (
          <p className="text-ink-300 text-sm">尚無選區，請先新增。</p>
        ) : (
          <div className="space-y-3">
            {races.map((race) => {
              const racePolls = polls.filter((p) => p.raceId === race.id)
              const isOpen = expandedRace === race.id
              return (
                <div key={race.id} className="bg-white border border-ink-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-ink-50 transition-colors"
                    onClick={() => setExpandedRace(isOpen ? null : race.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-ink-800">{race.city}</span>
                      <span className="text-xs text-ink-400 font-mono">{race.id}</span>
                      <span className="text-xs bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full">{race.region}</span>
                      <span className="text-xs text-ink-400">{racePolls.length} 筆民調</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); deleteRace(race.id) }}
                        className="text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                      {isOpen ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-ink-100 px-5 py-4">
                      <p className="text-xs font-bold text-ink-500 uppercase tracking-wide mb-2">候選人</p>
                      <div className="flex gap-4 mb-4">
                        {race.candidates.map((c) => (
                          <div key={c.name} className="flex items-center gap-1.5 text-sm">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="font-bold">{c.name}</span>
                            <span className="text-ink-400">({c.party})</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs font-bold text-ink-500 uppercase tracking-wide mb-2">民調列表</p>
                      {racePolls.length === 0 ? (
                        <p className="text-xs text-ink-300 mb-3">尚無民調</p>
                      ) : (
                        <div className="space-y-1 mb-3">
                          {racePolls.sort((a, b) => b.date.localeCompare(a.date)).map((poll) => (
                            <div key={poll.id} className="flex items-center justify-between text-xs bg-ink-50 rounded-lg px-3 py-2">
                              <span className="font-mono text-ink-500">{poll.date}</span>
                              <span className="text-ink-700">{poll.source}</span>
                              <span className="text-ink-400">
                                {poll.results.map((r) => `${r.name} ${r.percentage}%`).join('　')}
                              </span>
                              <button onClick={() => deletePoll(poll.id)}
                                className="text-red-300 hover:text-red-500 transition-colors ml-2">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ──────── 新增民調 ──────── */}
      <section className="bg-white border border-ink-200 rounded-2xl p-6">
        <h2 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
          <Plus size={16} /> 新增民調
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select className="input col-span-2" value={newPoll.raceId}
            onChange={(e) => updateRaceForPoll(e.target.value)}>
            <option value="">選擇選區</option>
            {races.map((r) => <option key={r.id} value={r.id}>{r.city}</option>)}
          </select>
          <input className="input" placeholder="民調機構" value={newPoll.source}
            onChange={(e) => setNewPoll((p) => ({ ...p, source: e.target.value }))} />
          <input className="input" type="date" value={newPoll.date}
            onChange={(e) => setNewPoll((p) => ({ ...p, date: e.target.value }))} />
          <input className="input" type="number" placeholder="樣本數" value={newPoll.sampleSize}
            onChange={(e) => setNewPoll((p) => ({ ...p, sampleSize: e.target.value }))} />
          <input className="input" type="number" step="0.1" placeholder="誤差範圍（%）" value={newPoll.marginOfError}
            onChange={(e) => setNewPoll((p) => ({ ...p, marginOfError: e.target.value }))} />
          <input className="input col-span-2" placeholder="來源網址（選填）" value={newPoll.url}
            onChange={(e) => setNewPoll((p) => ({ ...p, url: e.target.value }))} />
        </div>

        {newPoll.results.length > 0 && (
          <>
            <p className="text-xs font-bold text-ink-500 uppercase tracking-wide mb-2">各候選人支持度（%）</p>
            {newPoll.results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-ink-700 w-20">{r.name}</span>
                <input
                  className="input w-28"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={r.percentage}
                  onChange={(e) => {
                    const rs = [...newPoll.results]
                    rs[i] = { ...rs[i], percentage: e.target.value }
                    setNewPoll((p) => ({ ...p, results: rs }))
                  }}
                />
                <span className="text-ink-400 text-sm">%</span>
              </div>
            ))}
          </>
        )}

        <button onClick={savePoll}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-amber-700 text-white rounded-lg text-sm font-bold hover:bg-amber-800 transition-colors">
          <Save size={14} /> 儲存民調
        </button>
      </section>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2ddd6;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #3d3529;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }
      `}</style>
    </div>
  )
}
