import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers } from '../hooks/useMembers'
import { usePairs } from '../hooks/usePairs'
import { useOverrides } from '../hooks/useOverrides'
import { useHolidays } from '../hooks/useHolidays'
import { useDrafts } from '../hooks/useDrafts'
import { useAuth } from '../hooks/useAuth'
import MemberList from '../components/admin/MemberList'
import MemberModal from '../components/admin/MemberModal'
import PairList from '../components/admin/PairList'
import WeekOverviewTable from '../components/admin/WeekOverviewTable'
import HolidayList from '../components/admin/HolidayList'
import FloorView from '../components/viewer/FloorView'
import OverridePanel from '../components/admin/OverridePanel'
import StatsBar from '../components/viewer/StatsBar'
import { StatsBarSkeleton, ListSkeleton } from '../components/Skeleton'
import { toast } from '../components/Toast'
import { getWeekDates, formatDate } from '../lib/scheduleUtils'

const TABS = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'members',  label: 'Members' },
  { key: 'pairs',    label: 'Pairs' },
  { key: 'holidays', label: 'Holidays' },
]

export default function AdminPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [overridePanel, setOverridePanel] = useState(null)   // { member, date } | null
  const [addMemberDesk, setAddMemberDesk] = useState(null)  // { desk_row, desk_col } | null

  const [refreshing, setRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const drafts = useDrafts()
  const { members, loading: membersLoading, addMember, updateMember, deleteMember, refresh: refreshMembers } = useMembers({ includeDrafts: true, drafts })
  const { pairs, loading: pairsLoading, addPair, updatePair, deletePair, refresh: refreshPairs } = usePairs({ includeDrafts: true, drafts })
  const loading = membersLoading || pairsLoading

  const weekDates = getWeekDates(selectedDate)
  const monthStart = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const monthEnd   = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0))
  // Expand range to cover visible week (may cross month boundary, e.g. Jun 29 – Jul 3)
  const weekStart = formatDate(weekDates[0])
  const weekEnd   = formatDate(weekDates[4])
  const overrideFrom = weekStart < monthStart ? weekStart : monthStart
  const overrideTo   = weekEnd   > monthEnd   ? weekEnd   : monthEnd
  const { overrides, setOverride, removeOverride, refresh: refreshOverrides } = useOverrides({ from: overrideFrom, to: overrideTo }, { includeDrafts: true, drafts })
  const { holidays, addHoliday, toggleObserved, deleteHoliday, refresh: refreshHolidays } = useHolidays({ includeDrafts: true, drafts })

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([refreshMembers(), refreshPairs(), refreshOverrides(), refreshHolidays(), drafts.refresh()])
    setRefreshing(false)
  }

  async function handlePublish() {
    if (!drafts.pendingCount) return
    if (!window.confirm(`Publish ${drafts.pendingCount} pending change(s) to the live schedule?`)) return
    setPublishing(true)
    const { published, total } = await drafts.publish()
    setPublishing(false)
    if (published === total) {
      toast(`Published ${published} change(s)`, 'success')
    }
  }

  async function handleDiscard() {
    if (!drafts.pendingCount) return
    if (!window.confirm(`Discard ${drafts.pendingCount} pending change(s)? This cannot be undone.`)) return
    await drafts.discardAll()
  }

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
            {drafts.pendingCount > 0 && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {drafts.pendingCount} pending change{drafts.pendingCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={handleDiscard}
              disabled={!drafts.pendingCount}
              title="Discard all pending changes"
              className="text-xs text-gray-500 hover:text-red-600 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Discard draft
            </button>
            <button
              onClick={handlePublish}
              disabled={!drafts.pendingCount || publishing}
              title="Publish all pending changes to the live schedule"
              className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh all data"
              className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
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
                <StatsBar members={members} overrides={overrides} holidays={holidays} selectedDate={selectedDate} />
                <WeekOverviewTable members={members} overrides={overrides} holidays={holidays} weekStart={selectedDate} />

                {/* Floor view — one grid per day, scroll on mobile */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <FloorView
                      members={members}
                      pairs={pairs}
                      overrides={overrides}
                      holidays={holidays}
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

            {/* ── Holidays tab ── */}
            {activeTab === 'holidays' && (
              <HolidayList
                holidays={holidays}
                onAdd={addHoliday}
                onToggleObserved={toggleObserved}
                onDelete={deleteHoliday}
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
          holidays={holidays}
          onSet={setOverride}
          onRemove={removeOverride}
          onClose={() => setOverridePanel(null)}
        />
      )}
    </div>
  )
}
