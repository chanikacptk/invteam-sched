import { useState } from 'react'
import { formatDate, getWeekIndex, isInOffice, DAY_KEYS } from '../../lib/scheduleUtils'

const STATUS_OPTIONS = [
  { key: 'wfo', label: 'WFO', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400' },
  { key: 'wfh', label: 'WFH', active: 'bg-gray-500 text-white border-gray-500', inactive: 'bg-white text-gray-500 border-gray-300 hover:border-gray-400' },
  { key: 'leave', label: 'Leave', active: 'bg-amber-400 text-white border-amber-400', inactive: 'bg-white text-gray-500 border-gray-300 hover:border-amber-300' },
]

export default function OverridePanel({ member, date, overrides, onSet, onRemove, onClose }) {
  const override = overrides.find(o => o.member_id === member.id && o.date === formatDate(date))
  const dayKey = DAY_KEYS[date.getDay()]
  const weekIndex = getWeekIndex(date)
  const scheduledStatus = isInOffice(member, dayKey, weekIndex) ? 'wfo' : 'wfh'

  const [status, setStatus] = useState(override?.status || scheduledStatus)
  const [note, setNote] = useState(override?.note || '')
  const [saving, setSaving] = useState(false)

  const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  async function handleSave() {
    setSaving(true)
    await onSet(member.id, formatDate(date), status, note)
    setSaving(false)
    onClose()
  }

  async function handleClear() {
    setSaving(true)
    await onRemove(member.id, formatDate(date))
    setSaving(false)
    onClose()
  }

  return (
    /* Slide-in panel — fixed to the right side */
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop — clicking outside closes */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />

      <div className="relative ml-auto w-80 bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="font-bold text-gray-900">{member.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{dayLabel}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Schedule says */}
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 text-sm">
            <span className="text-gray-500">Schedule says: </span>
            <span className="font-semibold text-gray-800">{scheduledStatus === 'wfo' ? 'WFO' : 'WFH'}</span>
            {override && (
              <span className="ml-2 text-xs text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">overridden</span>
            )}
          </div>

          {/* Override status toggle */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Override</div>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setStatus(opt.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all
                    ${status === opt.key ? opt.active : opt.inactive}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note (optional)</div>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. Annual leave, sick day…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-100 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save override'}
          </button>
          {override && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="w-full border border-red-200 text-red-500 rounded-lg py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Clear override
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-500 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
