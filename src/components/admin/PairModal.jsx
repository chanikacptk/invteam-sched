import { useState } from 'react'
import { PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

export default function PairModal({ pair, members, onSave, onClose }) {
  const [name, setName] = useState(pair?.name || '')
  const [selectedMembers, setSelectedMembers] = useState(pair?.members || [])
  const [colorIdx, setColorIdx] = useState(pair?.color_idx ?? 0)
  const [saving, setSaving] = useState(false)

  function toggleMember(memberName) {
    setSelectedMembers(prev =>
      prev.includes(memberName) ? prev.filter(n => n !== memberName) : [...prev, memberName]
    )
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), members: selectedMembers, color_idx: colorIdx })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{pair ? 'Edit Pair' : 'Add Pair'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pair name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Beam & Anne"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {PAIR_COLORS.map((color, idx) => {
                const cls = PAIR_COLOR_CLASSES[color]
                return (
                  <button
                    key={color}
                    onClick={() => setColorIdx(idx)}
                    className={`w-7 h-7 rounded-full ${cls.dot} ring-2 ring-offset-2 transition-all ${colorIdx === idx ? 'ring-gray-400' : 'ring-transparent'}`}
                  />
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.name)}
                  className={`text-left px-3 py-1.5 rounded-lg text-sm border transition-colors
                    ${selectedMembers.includes(m.name)
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
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
