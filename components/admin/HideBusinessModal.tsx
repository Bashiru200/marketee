'use client'
import { useState } from 'react'
import { EyeOff, AlertTriangle, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Props {
  businessId:   string
  businessName: string
  currentStatus: string | null
  onClose:      () => void
  onDone:       () => void
}

const REASONS = [
  'Reported for scam or fraud',
  'Fake business or false information',
  'Prohibited products or services',
  'Copyright / trademark violation',
  'Duplicate listing',
  'Owner requested removal',
  'Under investigation',
  'Other (specify below)',
]

const STATUSES = [
  { value: 'hidden',         label: 'Hide',         desc: 'Not visible to public, still exists',  color: '#F59E0B' },
  { value: 'suspended',      label: 'Suspend',      desc: 'Owner locked out until reviewed',      color: '#EF4444' },
  { value: 'pending_review', label: 'Pending',      desc: 'Under review, temporarily invisible',  color: '#8B5CF6' },
  { value: 'active',         label: 'Restore',      desc: 'Make visible again',                    color: '#1D9E75' },
]

export default function HideBusinessModal({
  businessId, businessName, currentStatus, onClose, onDone,
}: Props) {
  const supabase = createClient()
  const { user }  = useAuth()

  const [status,    setStatus]    = useState(currentStatus === 'active' || !currentStatus ? 'hidden' : 'active')
  const [reason,    setReason]    = useState('')
  const [customReason, setCustom] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const isRestoring = status === 'active'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')

    const finalReason = reason === 'Other (specify below)' ? customReason : reason

    const { error: err } = await supabase
      .from('businesses')
      .update({
        status,
        hidden_reason: isRestoring ? null            : finalReason,
        hidden_at:     isRestoring ? null            : new Date().toISOString(),
        hidden_by:     isRestoring ? null            : user?.id,
      })
      .eq('id', businessId)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    // Log to audit trail
    await supabase.from('moderation_log').insert({
      business_id: businessId,
      admin_id:    user?.id,
      action:      status,
      reason:      isRestoring ? 'restored' : finalReason,
    }).then()

    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'#FEF3C7' }}>
              <EyeOff size={17} style={{ color:'#92400E' }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Moderate business</h2>
              <p className="text-xs text-gray-500 truncate max-w-xs">{businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* Status selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setStatus(s.value)}
                    className="flex flex-col items-start p-3 rounded-xl border text-left transition-all"
                    style={status === s.value
                      ? { borderColor: s.color, background:`${s.color}15` }
                      : { borderColor:'#E5E7EB', background:'white' }
                    }>
                    <span className="text-sm font-semibold" style={{ color: status === s.value ? s.color : '#111827' }}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason — only shown when hiding */}
            {!isRestoring && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Reason
                  </label>
                  <div className="space-y-2">
                    {REASONS.map(r => (
                      <label key={r}
                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                        style={reason === r
                          ? { borderColor:'#1D9E75', background:'#E1F5EE' }
                          : { borderColor:'#E5E7EB', background:'white' }
                        }>
                        <input type="radio" name="reason" value={r}
                          checked={reason === r}
                          onChange={e => setReason(e.target.value)}
                          className="accent-green-600" />
                        <span className="text-sm text-gray-800">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {reason === 'Other (specify below)' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Please specify
                    </label>
                    <textarea
                      value={customReason}
                      onChange={e => setCustom(e.target.value)}
                      rows={3}
                      required
                      placeholder="Describe the reason for this action..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl border"
                  style={{ background:'#FEF3C7', borderColor:'#FDE68A' }}>
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color:'#92400E' }} />
                  <p className="text-xs" style={{ color:'#92400E' }}>
                    The owner will still see their listing in their dashboard but it will be hidden from the public. The action will be logged.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="border-t border-gray-100 p-6 flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              disabled={saving || (!isRestoring && !reason) || (reason === 'Other (specify below)' && !customReason)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-2"
              style={{ background: isRestoring ? '#1D9E75' : '#EF4444' }}>
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : isRestoring
                  ? '✓ Restore business'
                  : `${STATUSES.find(s => s.value === status)?.label} business`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}