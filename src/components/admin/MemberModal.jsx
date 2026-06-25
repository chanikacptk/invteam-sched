import { useState } from 'react'
import { DESK_SLOTS } from '../viewer/FloorView'

const WEEK_DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
]

function daysToPattern(days) {
  const m = days.includes('mon')
  const w = days.includes('wed')
  const t = days.includes('thu')
  if (m && w) return 'MW'
  if (m && t) return 'MT'
  if (w && t) return 'WT'
  if (m) return 'MW'
  if (w) return 'WT'
  return 'MT'
}

function patternToDays(pattern) {
  if (pattern === 'MW') return ['mon', 'wed']
  if (pattern === 'MT') return ['mon', 'thu']
  if (pattern === 'WT') return ['wed', 'thu']
  return ['mon', 'wed']
}

function deskLabel(slot) {
  const cluster = slot.row <= 1 ? 'Top' : 'Bottom'
  const rowLetter = slot.row === 0 || slot.row === 4 ? 'A' : 'B'
  return `${cluster} ${rowLetter} (row ${slot.row}, col ${slot.col})`
}

export default function MemberModal({ member, onSave, onClose }) {
  const [name, setName] = useState(member?.name || '')
  const [fixedDays, setFixedDays] = useState(member?.fixed_days || [])
  const [weekDays, setWeekDays] = useState(
    (member?.rotation || ['MW', 'MW', 'MT', 'MT']).map(patternToDays)
  )
  const [deskRow, setDeskRow] = useState(member?.desk_row ?? '')
  const [deskCol, setDeskCol] = useState(member?.desk_col ?? '')
  const [saving, setSaving] = useState(false)

  function toggleFixedDay(day) {
    setFixedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function toggleWeekDay(weekIdx, day) {
    setWeekDays(prev =>
      prev.map((w, i) =>
        i === weekIdx
          ? w.includes(day) ? w.filter(d => d !== day) : [...w, day]
          : w
      )
    )
  }

  function handleDeskChange(val) {
    if (val === '') { setDeskRow(''); setDeskCol(''); return }
    const slot = DESK_SLOTS[parseInt(val)]
    if (slot) { setDeskRow(slot.row); setDeskCol(slot.col) }
  }

  function selectedDeskIdx() {
    if (deskRow === '' || deskCol === '') return ''
    const idx = DESK_SLOTS.findIndex(s => s.row === deskRow && s.col === deskCol)
    return idx >= 0 ? String(idx) : ''
  }

  function getCluster(row) {
    return row <= 1 ? 'A' : 'B'
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const rotation = weekDays.map(daysToPattern)
    const payload = {
      name: name.trim(),
      fixed_days: fixedDays,
      rotation,
      desk_row: deskRow !== '' ? deskRow : null,
      desk_col: deskCol !== '' ? deskCol : null,
      cluster: deskRow !== '' ? getCluster(deskRow) : null,
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{member?.name ? 'Edit Member' : 'Add Member'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
            />
          </div>

          {/* Fixed days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fixed days (always in office)</label>
            <div className="flex gap-2 flex-wrap">
              <button disabled className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-blue-50 text-blue-500 border-blue-200 opacity-70 cursor-not-allowed">
                Tue ✓
              </button>
              {WEEK_DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleFixedDay(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${fixedDays.includes(key)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}`}
                >
                  {label}
                </button>
              ))}
              <button disabled className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-gray-50 text-gray-300 border-gray-200 opacity-70 cursor-not-allowed">
                Fri WFH
              </button>
            </div>
          </div>

          {/* 4-week rotation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rotation schedule (4-week cycle)</label>
            <div className="space-y-2">
              {weekDays.map((days, weekIdx) => (
                <div key={weekIdx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-14 shrink-0">Week {weekIdx + 1}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-500 border border-blue-200">
                      Tue
                    </div>
                    {WEEK_DAYS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleWeekDay(weekIdx, key)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors
                          ${days.includes(key)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-emerald-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">→ {daysToPattern(days)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Tuesday always in-office. Friday always WFH.</p>
          </div>

          {/* Desk assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Desk assignment</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={selectedDeskIdx()}
              onChange={e => handleDeskChange(e.target.value)}
            >
              <option value="">— No desk assigned —</option>
              <optgroup label="Top block">
                {DESK_SLOTS.filter(s => s.row <= 1).map(s => {
                  const idx = DESK_SLOTS.indexOf(s)
                  return <option key={idx} value={idx}>{deskLabel(s)}</option>
                })}
              </optgroup>
              <optgroup label="Bottom block">
                {DESK_SLOTS.filter(s => s.row >= 4).map(s => {
                  const idx = DESK_SLOTS.indexOf(s)
                  return <option key={idx} value={idx}>{deskLabel(s)}</option>
                })}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
