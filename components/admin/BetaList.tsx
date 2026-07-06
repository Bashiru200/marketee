'use client'
import { useEffect, useState } from 'react'
import {
  Users, Mail, Clock, Download, RefreshCw,
  CheckCircle2, XCircle, Loader2, Search,
  Key, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WaitlistEntry {
  id:         string
  email:      string
  source:     string | null
  created_at: string
}

interface BetaCode {
  id:        string
  code:      string
  label:     string | null
  max_uses:  number
  uses:      number
  active:    boolean
  created_at:string
}

export default function BetaList() {
  const supabase = createClient()

  // Waitlist
  const [waitlist,   setWaitlist]   = useState<WaitlistEntry[]>([])
  const [wLoading,   setWLoading]   = useState(true)
  const [wSearch,    setWSearch]    = useState('')

  // Beta codes
  const [codes,      setCodes]      = useState<BetaCode[]>([])
  const [cLoading,   setCLoading]   = useState(true)
  const [newCode,    setNewCode]    = useState('')
  const [newLabel,   setNewLabel]   = useState('')
  const [newMax,     setNewMax]     = useState('10')
  const [adding,     setAdding]     = useState(false)

  // Tab
  const [tab,        setTab]        = useState<'waitlist' | 'codes'>('waitlist')
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load waitlist ─────────────────────────────────────────────────────
  async function loadWaitlist() {
    setWLoading(true)
    const { data } = await supabase
      .from('early_access')
      .select('id, email, source, created_at')
      .order('created_at', { ascending: false })
    setWaitlist(data ?? [])
    setWLoading(false)
  }

  // ── Load beta codes ───────────────────────────────────────────────────
  async function loadCodes() {
    setCLoading(true)
    const { data } = await supabase
      .from('beta_codes')
      .select('id, code, label, max_uses, uses, active, created_at')
      .order('created_at', { ascending: false })
    setCodes(data ?? [])
    setCLoading(false)
  }

  useEffect(() => { loadWaitlist(); loadCodes() }, [])

  // ── Export waitlist as CSV ────────────────────────────────────────────
  function exportCSV() {
    const rows = [
      ['Email', 'Source', 'Signed up'],
      ...waitlist.map(w => [
        w.email,
        w.source ?? 'coming_soon',
        new Date(w.created_at).toLocaleDateString('en-US'),
      ])
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `markeetee-waitlist-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Delete waitlist entry ─────────────────────────────────────────────
  async function deleteWaitlist(id: string) {
    await supabase.from('early_access').delete().eq('id', id)
    setWaitlist(ws => ws.filter(w => w.id !== id))
    showToast('Removed from waitlist')
  }

  // ── Add beta code ─────────────────────────────────────────────────────
  async function addCode(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.trim()) { showToast('Enter a code', false); return }
    setAdding(true)
    const { data, error } = await supabase
      .from('beta_codes')
      .insert({
        code:     newCode.trim().toUpperCase(),
        label:    newLabel.trim() || null,
        max_uses: parseInt(newMax) || 10,
        uses:     0,
        active:   true,
      })
      .select().single()
    if (error) {
      showToast(error.code === '23505' ? 'Code already exists' : error.message, false)
    } else {
      setCodes(cs => [data, ...cs])
      setNewCode(''); setNewLabel(''); setNewMax('10')
      showToast('Code created!')
    }
    setAdding(false)
  }

  // ── Toggle code active ────────────────────────────────────────────────
  async function toggleCode(id: string, active: boolean) {
    await supabase.from('beta_codes').update({ active: !active }).eq('id', id)
    setCodes(cs => cs.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  // ── Delete code ───────────────────────────────────────────────────────
  async function deleteCode(id: string) {
    if (!confirm('Delete this code?')) return
    await supabase.from('beta_codes').delete().eq('id', id)
    setCodes(cs => cs.filter(c => c.id !== id))
    showToast('Code deleted')
  }

  const filteredWaitlist = waitlist.filter(w =>
    w.email.toLowerCase().includes(wSearch.toLowerCase())
  )

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          toast.ok
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {toast.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Beta Access</h2>
          <p className="text-sm text-gray-400">
            {waitlist.length} on waitlist · {codes.filter(c => c.active).length} active codes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { loadWaitlist(); loadCodes() }}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          {tab === 'waitlist' && (
            <button onClick={exportCSV}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl"
              style={{ background: '#1D9E75' }}>
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: 'waitlist', label: `Waitlist (${waitlist.length})`, icon: Mail },
          { id: 'codes',    label: `Beta codes (${codes.length})`,  icon: Key  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.id
              ? { background: 'white', color: '#085041', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#6B7280' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Waitlist tab ── */}
      {tab === 'waitlist' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={wSearch}
              onChange={e => setWSearch(e.target.value)}
              placeholder="Search emails…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total signups',   value: waitlist.length,                                           icon: Users   },
              { label: 'This week',       value: waitlist.filter(w => new Date(w.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length, icon: Clock },
              { label: 'Today',           value: waitlist.filter(w => new Date(w.created_at).toDateString() === new Date().toDateString()).length, icon: Mail },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Waitlist table */}
          {wLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : filteredWaitlist.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <Mail size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">
                {wSearch ? 'No emails match your search' : 'No waitlist signups yet'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Signed up</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.map((w, i) => (
                    <tr key={w.id}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.email}</td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {w.source ?? 'coming_soon'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                        {new Date(w.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteWaitlist(w.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Beta codes tab ── */}
      {tab === 'codes' && (
        <div className="space-y-4">

          {/* Add new code form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Create new code</h3>
            <form onSubmit={addCode} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text" value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="Code (e.g. BETA2024)"
                className="sm:col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent font-mono tracking-wider"
              />
              <input
                type="text" value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              />
              <div className="flex gap-2">
                <input
                  type="number" value={newMax} min="1"
                  onChange={e => setNewMax(e.target.value)}
                  placeholder="Max uses"
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
                <button type="submit" disabled={adding}
                  className="flex-1 flex items-center justify-center gap-1 text-sm font-semibold text-white rounded-xl disabled:opacity-60"
                  style={{ background: '#1D9E75' }}>
                  {adding ? <Loader2 size={14} className="animate-spin" /> : '+ Add'}
                </button>
              </div>
            </form>
          </div>

          {/* Codes list */}
          {cLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <Key size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No beta codes yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codes.map(c => {
                const pct = Math.round((c.uses / c.max_uses) * 100)
                return (
                  <div key={c.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    {/* Code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-gray-900 tracking-wider">{c.code}</span>
                        {!c.active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Disabled
                          </span>
                        )}
                      </div>
                      {c.label && <p className="text-xs text-gray-400">{c.label}</p>}
                      {/* Usage bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: pct >= 90 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#1D9E75',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {c.uses}/{c.max_uses} used
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleCode(c.id, c.active)}
                        title={c.active ? 'Disable code' : 'Enable code'}
                        className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        {c.active
                          ? <ToggleRight size={18} style={{ color: '#1D9E75' }} />
                          : <ToggleLeft  size={18} className="text-gray-300" />
                        }
                      </button>
                      <button onClick={() => deleteCode(c.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}