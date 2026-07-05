'use client'
import { useEffect, useState } from 'react'
import {
  Megaphone, Plus, X, Trash2, Eye, EyeOff,
  Info, CheckCircle, AlertTriangle, AlertCircle,
  Loader2, Calendar, Link as LinkIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'

interface Announcement {
  id:         string
  message:    string
  type:       'info' | 'success' | 'warning' | 'error'
  link_text:  string | null
  link_url:   string | null
  active:     boolean
  created_at: string
  expires_at: string | null
}

const TYPE_OPTIONS = [
  { value:'info',    label:'Info',    icon:Info,          color:'#3B82F6', bg:'#EFF6FF' },
  { value:'success', label:'Success', icon:CheckCircle,   color:'#22C55E', bg:'#F0FDF4' },
  { value:'warning', label:'Warning', icon:AlertTriangle, color:'#F59E0B', bg:'#FFFBEB' },
  { value:'error',   label:'Error',   icon:AlertCircle,   color:'#EF4444', bg:'#FEF2F2' },
] as const

type AnnouncementType = typeof TYPE_OPTIONS[number]['value']

const DEFAULT_FORM = {
  message:   '',
  type:      'info' as AnnouncementType,
  link_text: '',
  link_url:  '',
  expires_at:'',
}

export default function AnnouncementManager() {
  const supabase = createClient()
  const { user } = useAuth()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [form,          setForm]          = useState(DEFAULT_FORM)
  const [saving,        setSaving]        = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)
  const [toggling,      setToggling]      = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState<string | null>(null)

  useEffect(() => { loadAnnouncements() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function upd(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function loadAnnouncements() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('id, message, type, link_text, link_url, active, created_at, expires_at')
      .order('created_at', { ascending: false })
    setAnnouncements((data ?? []) as Announcement[])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.message.trim()) return
    setSaving(true)

    const { error } = await supabase.from('announcements').insert({
      message:    form.message.trim(),
      type:       form.type,
      link_text:  form.link_text.trim() || null,
      link_url:   form.link_url.trim()  || null,
      expires_at: form.expires_at       || null,
      active:     true,
      created_by: user?.id ?? null,
    })

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      await loadAnnouncements()
      setForm(DEFAULT_FORM)
      setShowForm(false)
      showToast('Announcement created and live')
    }
    setSaving(false)
  }

  async function toggleActive(a: Announcement) {
    setToggling(a.id)
    const { error } = await supabase
      .from('announcements')
      .update({ active: !a.active })
      .eq('id', a.id)

    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setAnnouncements(as => as.map(x => x.id === a.id ? { ...x, active: !a.active } : x))
      showToast(a.active ? 'Announcement hidden' : 'Announcement is now live')
    }
    setToggling(null)
  }

  async function deleteAnnouncement(id: string) {
    setDeleting(id)
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setAnnouncements(as => as.filter(a => a.id !== id))
      showToast('Announcement deleted')
    }
    setDeleting(null)
  }

  const activeCount = announcements.filter(a => a.active).length

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Site announcements</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeCount > 0
              ? `${activeCount} active banner${activeCount !== 1 ? 's' : ''} showing to all users`
              : 'No active banners — users see nothing'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background:'#085041' }}
        >
          <Plus size={15} /> New announcement
        </button>
      </div>

      {/* Preview of active banners */}
      {activeCount > 0 && (
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live preview — what users see</p>
          </div>
          {announcements.filter(a => a.active).map(a => {
            const opt   = TYPE_OPTIONS.find(t => t.value === a.type) ?? TYPE_OPTIONS[0]
            const Icon  = opt.icon
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{ background: opt.bg, borderBottom: '1px solid #E5E7EB' }}>
                <Icon size={15} style={{ color: opt.color, flexShrink:0 }} />
                <p className="flex-1 font-medium" style={{ color: opt.color }}>{a.message}</p>
                {a.link_text && <span className="underline text-xs" style={{ color: opt.color }}>{a.link_text} →</span>}
                <X size={13} style={{ color: opt.color, opacity:0.5 }} />
              </div>
            )
          })}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-dashed p-6" style={{ borderColor:'#1D9E75' }}>
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone size={16} style={{ color:'#1D9E75' }} />
              New announcement
            </h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Type</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => {
                  const Icon    = opt.icon
                  const selected = form.type === opt.value
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => upd('type', opt.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all"
                      style={{
                        borderColor: selected ? opt.color   : '#E5E7EB',
                        background:  selected ? opt.bg      : 'white',
                        color:       selected ? opt.color   : '#6B7280',
                      }}>
                      <Icon size={12} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Message *</label>
              <textarea
                value={form.message}
                onChange={e => upd('message', e.target.value)}
                placeholder="Enter announcement message"
                rows={2}
                required
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{form.message.length}/300</p>
            </div>

            {/* Optional link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Link text <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.link_text}
                  onChange={e => upd('link_text', e.target.value)}
                  placeholder="Enter link text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Link URL <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.link_url}
                  onChange={e => upd('link_url', e.target.value)}
                  placeholder="Enter link URL"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Auto-expire <span className="font-normal normal-case">(optional — leave blank to keep until manually hidden)</span>
              </label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => upd('expires_at', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !form.message.trim()}
                className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl disabled:opacity-60"
                style={{ background:'#1D9E75' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Publishing…</> : <><Megaphone size={14} /> Publish now</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
              <div className="h-3 w-1/3 bg-gray-200 rounded" style={{ animation:'shimmer 1.8s ease-in-out infinite' }} />
            </div>
          ))}
          <style dangerouslySetInnerHTML={{ __html: '@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}' }} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Megaphone size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">No announcements yet</p>
          <p className="text-xs text-gray-400 mt-1">Create one to show a banner to all users</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const opt  = TYPE_OPTIONS.find(t => t.value === a.type) ?? TYPE_OPTIONS[0]
            const Icon = opt.icon
            const expired = a.expires_at && new Date(a.expires_at) < new Date()
            return (
              <div key={a.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4"
                style={{ opacity: !a.active || expired ? 0.6 : 1 }}>

                {/* Type icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: opt.bg }}>
                  <Icon size={16} style={{ color: opt.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.message}</p>
                  {(a.link_text || a.link_url) && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <LinkIcon size={10} />
                      {a.link_text && <span>{a.link_text}</span>}
                      {a.link_url  && <span className="truncate">{a.link_url}</span>}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {expired ? 'Expired' : a.active ? 'Live' : 'Hidden'}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{a.type}</span>
                    <span className="text-xs text-gray-400">
                      Created {new Date(a.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </span>
                    {a.expires_at && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        Expires {new Date(a.expires_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(a)}
                    disabled={toggling === a.id || !!expired}
                    title={a.active ? 'Hide announcement' : 'Show announcement'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                    style={a.active && !expired
                      ? { background:'#E1F5EE', borderColor:'#1D9E75', color:'#1D9E75' }
                      : { borderColor:'#E5E7EB', color:'#9CA3AF' }
                    }
                  >
                    {toggling === a.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : a.active ? <Eye size={13} /> : <EyeOff size={13} />
                    }
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    disabled={deleting === a.id}
                    title="Delete announcement"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    {deleting === a.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}