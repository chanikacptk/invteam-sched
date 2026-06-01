import { useState } from 'react'
import PairModal from './PairModal'
import { PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

export default function PairList({ pairs, members, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  async function handleSave(data) {
    if (editing) {
      await onUpdate(editing.id, data)
    } else {
      await onAdd(data)
    }
    setShowModal(false)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Pairs ({pairs.length})</h3>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700"
        >
          + Add Pair
        </button>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          No pairs yet.
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map(pair => {
            const colorName = PAIR_COLORS[pair.color_idx ?? 0] || 'violet'
            const cls = PAIR_COLOR_CLASSES[colorName]
            return (
              <div key={pair.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${cls.bg} ${cls.border}`}>
                <div>
                  <div className={`font-medium text-sm ${cls.text}`}>{pair.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{(pair.members || []).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(pair); setShowModal(true) }}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-white/50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(pair.id)}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PairModal
          pair={editing}
          members={members}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
