import { useState } from 'react'

const emptyForm = { date: '', name_th: '', name_en: '', is_observed: true }

export default function HolidayList({ holidays, onAdd, onToggleObserved, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const today = new Date()
  const currentYear = today.getFullYear()
  const years = [...new Set(holidays.map(h => h.date.slice(0, 4)))].sort()
  const [activeYear, setActiveYear] = useState(String(currentYear))

  const visibleYears = years.includes(String(currentYear)) ? years : [...years, String(currentYear)].sort()
  const filtered = holidays.filter(h => h.date.startsWith(activeYear))

  async function handleAdd() {
    if (!form.date || !form.name_en) return
    setSaving(true)
    await onAdd({ ...form })
    setSaving(false)
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Thai Public Holidays</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Toggle off any holiday the company doesn't observe — everyone follows their normal schedule that day instead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {visibleYears.map(y => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                  ${activeYear === y ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {y}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
          >
            + Add holiday
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Name (English)"
              value={form.name_en}
              onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="ชื่อวันหยุด (ไทย)"
              value={form.name_th}
              onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-emerald-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="text-gray-500 text-sm px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-gray-400">No holidays for {activeYear} yet.</div>
        )}
        {filtered.map(h => {
          const date = new Date(h.date + 'T00:00:00')
          const dateLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
          return (
            <div key={h.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 w-24 shrink-0">{dateLabel}</span>
                  <span className={`text-sm font-medium truncate ${h.is_observed ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {h.name_en}
                  </span>
                  {h._draft && (
                    <span title="Pending publish" className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                  )}
                </div>
                {h.name_th && <div className="text-xs text-gray-400 ml-26 pl-0">{h.name_th}</div>}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onToggleObserved(h.id, !h.is_observed)}
                  title={h.is_observed ? 'Company observes this holiday — click to mark as a normal working day' : 'Company does not observe this holiday — click to restore'}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${h.is_observed ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${h.is_observed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>

                {confirmDeleteId === h.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { onDelete(h.id); setConfirmDeleteId(null) }} className="text-xs text-red-600 font-medium">Confirm</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(h.id)} className="text-gray-300 hover:text-red-500 text-sm">✕</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
