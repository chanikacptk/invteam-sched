import { useState } from 'react'
import { formatDate, getWeekIndex, isInOffice, getHoliday, DAY_KEYS } from '../../lib/scheduleUtils'

const STATUS_OPTIONS = [
  { key: 'wfo',   label: 'WFO',   active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400' },
  { key: 'wfh',   label: 'WFH',   active: 'bg-gray-500 text-white border-gray-500',       inactive: 'bg-white text-gray-500 border-gray-300 hover:border-gray-400' },
  { key: 'leave', label: 'Leave', active: 'bg-amber-400 text-white border-amber-400',     inactive: 'bg-white text-gray-500 border-gray-300 hover:border-amber-300' },
]

const STATUS_LABEL = { wfo: 'WFO', wfh: 'WFH', leave: 'On Leave', holiday: 'Holiday' }
const STATUS_COLOR = {
  wfo:     'text-emerald-700 bg-emerald-50',
  wfh:     'text-gray-600 bg-gray-100',
  leave:   'text-amber-700 bg-amber-50',
  holiday: 'text-sky-700 bg-sky-50',
}

export default function OverridePanel({ member, date, overrides, holidays, onSet, onRemove, onClose }) {
  const override = overrides.find(o => o.member_id === member.id && o.date === formatDate(date))
  const dayKey = DAY_KEYS[date.getDay()]
  const weekIndex = getWeekIndex(date)
  const holiday = getHoliday(date, holidays)
  const scheduledStatus = holiday ? 'holiday' : (isInOffice(member, dayKey, weekIndex) ? 'wfo' : 'wfh')

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

  async function handleReset() {
    setSaving(true)
    await onRemove(member.id, formatDate(date))
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
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
        <div className="flex-1 p-5 overflow-y-auto space-y-4">

          {/* Holiday note */}
          {holiday && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700">
              🇹🇭 {holiday.name_en} — company holiday, everyone defaults to off unless overridden.
            </div>
          )}

          {/* Current status info box */}
          {override ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  {override._draft ? 'Draft — not yet published' : 'Manually overridden'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[override.status]}`}>
                  {STATUS_LABEL[override.status]}
                </span>
              </div>
              {override.note && (
                <div className="text-xs text-amber-800 italic">"{override.note}"</div>
              )}
              <div className="text-xs text-amber-600 pt-0.5">
                Schedule would be: <span className="font-semibold">{STATUS_LABEL[scheduledStatus]}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Following schedule</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[scheduledStatus]}`}>
                {STATUS_LABEL[scheduledStatus]}
              </span>
            </div>
          )}

          {/* Override toggle */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Set override</div>
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
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note (optional)</div>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. Annual leave, sick day…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save override'}
          </button>

          {/* Reset to schedule — only when override exists */}
          {override && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="w-full border border-gray-200 text-gray-500 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>↺</span> Reset to schedule
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
