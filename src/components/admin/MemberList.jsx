import { useState } from 'react'
import MemberModal from './MemberModal'
import { getAttendanceStatus, getWeekDates, formatDate, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

const PATTERN_LABEL = { MW: 'Mon·Wed', MT: 'Mon·Thu', WT: 'Wed·Thu' }
const DOT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DOT_LABELS = ['M', 'T', 'W', 'T', 'F']

function getDeskLabel(member) {
  if (member.desk_row == null || member.desk_col == null) return null
  const cluster = member.desk_row <= 1 ? 'Top' : 'Bottom'
  const rowLetter = member.desk_row === 0 || member.desk_row === 4 ? 'A' : 'B'
  return `${cluster} ${rowLetter} (r${member.desk_row},c${member.desk_col})`
}

export default function MemberList({ members, pairs = [], onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const today = new Date()
  const weekDates = getWeekDates(today)

  async function handleSave(data) {
    if (editing) {
      await onUpdate(editing.id, data)
    } else {
      await onAdd(data)
    }
    setShowModal(false)
    setEditing(null)
  }

  async function handleDelete(id) {
    await onDelete(id)
    setConfirmDelete(null)
  }

  function getMemberPair(member) {
    return pairs.find(p => (p.members || []).includes(member.name))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Members ({members.length})</h3>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700"
        >
          + Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          No members yet. Add your first team member.
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => {
            const pair = getMemberPair(member)
            const pairCls = pair ? PAIR_COLOR_CLASSES[PAIR_COLORS[pair.color_idx ?? 0] || 'violet'] : null
            const deskLabel = getDeskLabel(member)

            return (
              <div key={member.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                    {member._draft && (
                      <span title="Pending publish" className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    )}
                    {pair && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pairCls.bg} ${pairCls.text}`}>
                        {pair.name}
                      </span>
                    )}
                    {deskLabel && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        🪑 {deskLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                    {(member.rotation || []).map((p, i) => (
                      <span key={i}>W{i + 1}: {PATTERN_LABEL[p] || p}</span>
                    ))}
                    {(member.fixed_days || []).length > 0 && (
                      <span className="text-emerald-600">Fixed: {member.fixed_days.join(', ')}</span>
                    )}
                  </div>
                </div>

                {/* This-week schedule dots */}
                <div className="flex gap-1 shrink-0">
                  {weekDates.map((date, i) => {
                    const status = getAttendanceStatus(member, date, [])
                    return (
                      <div
                        key={i}
                        title={`${DOT_LABELS[i]}: ${status.toUpperCase()}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white font-bold
                          ${status === 'wfo' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        style={{ fontSize: '8px' }}
                      >
                        {DOT_LABELS[i]}
                      </div>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(member); setShowModal(true) }}
                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  {confirmDelete === member.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(member.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <MemberModal
          member={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
