import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers } from '../hooks/useMembers'
import { usePairs } from '../hooks/usePairs'
import { useOverrides } from '../hooks/useOverrides'
import { useAuth } from '../hooks/useAuth'
import MemberList from '../components/admin/MemberList'
import MemberModal from '../components/admin/MemberModal'
import PairList from '../components/admin/PairList'
import WeekOverviewTable from '../components/admin/WeekOverviewTable'
import FloorView from '../components/viewer/FloorView'
import OverridePanel from '../components/admin/OverridePanel'
import StatsBar from '../components/viewer/StatsBar'
import { StatsBarSkeleton, ListSkeleton } from '../components/Skeleton'
import { getWeekDates, formatDate } from '../lib/scheduleUtils'

const TABS = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'members',  label: 'Members' },
  { key: 'pairs',    label: 'Pairs' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [overridePanel, setOverridePanel] = useState(null)   // { member, date } | null
  const [addMemberDesk, setAddMemberDesk] = useState(null)  // { desk_row, desk_col } | null

  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useMembers()
  const { pairs, loading: pairsLoading, addPair, updatePair, deletePair } = usePairs()
  const loading = membersLoading || pairsLoading

  const weekDates = getWeekDates(selectedDate)
  const monthStart = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const monthEnd   = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0))
  const { overrides, setOverride, removeOverride } = useOverrides({ from: monthStart, to: monthEnd })

  const weekLabel = `${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDates[4].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

  function prevWeek() { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d) }
  function nextWeek() { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d) }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">INV Admin</h1>
            <p className="text-xs text-gray-400">Schedule management</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Week nav — schedule tab only */}
        {activeTab === 'schedule' && (
          <div className="flex items-center gap-3">
            <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-500 text-lg leading-none">‹</button>
            <span className="text-sm font-semibold text-gray-700 flex-1 text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-500 text-lg leading-none">›</button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs text-emerald-600 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50"
            >
              Today
            </button>
          </div>
        )}

        {loading ? (
          <>
            <StatsBarSkeleton />
            <ListSkeleton rows={4} />
          </>
        ) : (
          <>
            {/* ── Schedule tab ── */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <StatsBar members={members} overrides={overrides} selectedDate={selectedDate} />
                <WeekOverviewTable members={members} overrides={overrides} weekStart={selectedDate} />

                {/* Floor view — one grid per day, scroll on mobile */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <FloorView
                      members={members}
                      pairs={pairs}
                      overrides={overrides}
                      weekDates={weekDates}
                      onDeskClick={(member, dateOrSlot, date) => {
                        if (member) {
                          // member chip → open override panel for that specific day
                          setOverridePanel({ member, date: date || dateOrSlot })
                        } else if (dateOrSlot?.row != null) {
                          // empty desk → open add-member modal pre-filled with desk position
                          setAddMemberDesk({ desk_row: dateOrSlot.row, desk_col: dateOrSlot.col })
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Click a member chip to override attendance · Click + to add a member to that desk
                </p>
              </div>
            )}

            {/* ── Members tab ── */}
            {activeTab === 'members' && (
              <MemberList
                members={members}
                pairs={pairs}
                onAdd={addMember}
                onUpdate={updateMember}
                onDelete={deleteMember}
              />
            )}

            {/* ── Pairs tab ── */}
            {activeTab === 'pairs' && (
              <PairList
                pairs={pairs}
                members={members}
                onAdd={addPair}
                onUpdate={updatePair}
                onDelete={deletePair}
              />
            )}
          </>
        )}
      </div>

      {/* Add member modal — triggered from empty desk click */}
      {addMemberDesk && (
        <MemberModal
          member={addMemberDesk}
          onSave={async (data) => { await addMember(data); setAddMemberDesk(null) }}
          onClose={() => setAddMemberDesk(null)}
        />
      )}

      {/* Override panel — slide-in from right */}
      {overridePanel && (
        <OverridePanel
          member={overridePanel.member}
          date={overridePanel.date}
          overrides={overrides}
          onSet={setOverride}
          onRemove={removeOverride}
          onClose={() => setOverridePanel(null)}
        />
      )}
    </div>
  )
}
