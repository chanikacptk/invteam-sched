import { useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { usePairs } from '../hooks/usePairs'
import { useOverrides } from '../hooks/useOverrides'
import { useHolidays } from '../hooks/useHolidays'
import StatsBar from '../components/viewer/StatsBar'
import FloorView from '../components/viewer/FloorView'
import WeekCalendar from '../components/viewer/WeekCalendar'
import MonthCalendar from '../components/viewer/MonthCalendar'
import { StatsBarSkeleton, ListSkeleton } from '../components/Skeleton'
import { getWeekDates, formatDate, getAttendanceStatus, getHoliday, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../lib/scheduleUtils'

const VIEWS = ['Month', 'Week', 'Floor']

export default function ViewerPage() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [calView, setCalView] = useState('month')
  const [dayPanel, setDayPanel] = useState(null) // Date | null

  const { members, loading: membersLoading } = useMembers()
  const { pairs, loading: pairsLoading } = usePairs()
  const loading = membersLoading || pairsLoading

  const weekDates = getWeekDates(selectedDate)
  const monthStart = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const monthEnd   = formatDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0))
  const weekStart  = formatDate(weekDates[0])
  const weekEnd    = formatDate(weekDates[4])
  const overrideFrom = weekStart < monthStart ? weekStart : monthStart
  const overrideTo   = weekEnd   > monthEnd   ? weekEnd   : monthEnd
  const { overrides } = useOverrides({ from: overrideFrom, to: overrideTo })
  const { holidays } = useHolidays()
  const weekLabel = `${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDates[4].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const monthLabel = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  function prevPeriod() {
    const d = new Date(selectedDate)
    if (calView === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setSelectedDate(d)
  }

  function nextPeriod() {
    const d = new Date(selectedDate)
    if (calView === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setSelectedDate(d)
  }

  function getPairCardClass(memberName) {
    const pair = pairs.find(p => (p.members || []).includes(memberName))
    if (!pair) return null
    return PAIR_COLOR_CLASSES[PAIR_COLORS[pair.color_idx ?? 0] || 'violet']
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">INV Team Schedule</h1>
            <p className="text-xs text-gray-400">Inventory team attendance</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setCalView(v.toLowerCase())}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${calView === v.toLowerCase() ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Period nav */}
        <div className="flex items-center gap-3">
          <button onClick={prevPeriod} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-500 text-lg leading-none">‹</button>
          <span className="text-sm font-semibold text-gray-700 flex-1 text-center">
            {calView === 'month' ? monthLabel : weekLabel}
          </span>
          <button onClick={nextPeriod} className="p-2 rounded-lg hover:bg-white border border-gray-200 text-gray-500 text-lg leading-none">›</button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-xs text-emerald-600 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50"
          >
            Today
          </button>
        </div>

        {loading ? (
          <>
            <StatsBarSkeleton />
            <ListSkeleton rows={3} />
          </>
        ) : (
          <>
            <StatsBar members={members} overrides={overrides} holidays={holidays} selectedDate={selectedDate} />

            {calView === 'floor' && (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <FloorView
                    members={members}
                    pairs={pairs}
                    overrides={overrides}
                    holidays={holidays}
                    weekDates={weekDates}
                  />
                </div>
              </div>
            )}

            {calView === 'week' && (
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <WeekCalendar
                    members={members}
                    pairs={pairs}
                    overrides={overrides}
                    holidays={holidays}
                    weekStart={selectedDate}
                    onDayClick={setDayPanel}
                  />
                </div>
              </div>
            )}

            {calView === 'month' && (
              <MonthCalendar
                members={members}
                pairs={pairs}
                overrides={overrides}
                holidays={holidays}
                year={selectedDate.getFullYear()}
                month={selectedDate.getMonth()}
                onDayClick={setDayPanel}
              />
            )}
          </>
        )}
      </div>

      {/* Day side panel */}
      {dayPanel && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-end" onClick={() => setDayPanel(null)}>
          <div
            className="bg-white h-full w-80 shadow-xl p-5 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-gray-900 text-sm">
                {dayPanel.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button onClick={() => setDayPanel(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {getHoliday(dayPanel, holidays) && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 mb-4">
                🇹🇭 {getHoliday(dayPanel, holidays).name_en}
              </div>
            )}

            {[
              { status: 'wfo',     label: 'In Office', color: 'emerald' },
              { status: 'leave',   label: 'On Leave',  color: 'amber' },
              { status: 'holiday', label: 'Holiday',   color: 'sky' },
              { status: 'wfh',     label: 'WFH',       color: 'gray' },
            ].map(({ status, label, color }) => {
              const group = members.filter(m => getAttendanceStatus(m, dayPanel, overrides, holidays) === status)
              if (group.length === 0) return null
              return (
                <div key={status} className="mb-5">
                  <div className={`text-xs font-semibold text-${color}-600 uppercase tracking-wide mb-2`}>
                    {label} ({group.length})
                  </div>
                  <div className="space-y-1">
                    {group.map(m => {
                      const pairCls = status === 'wfo' ? getPairCardClass(m.name) : null
                      return (
                        <div
                          key={m.id}
                          className={`text-sm px-3 py-1.5 rounded-lg font-medium
                            ${pairCls ? `${pairCls.bg} ${pairCls.text}` : `bg-${color}-50 text-${color}-800`}`}
                        >
                          {m.name}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
