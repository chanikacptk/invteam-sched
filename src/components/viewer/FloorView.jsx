import { getAttendanceStatus, formatDate, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

export const DESK_SLOTS = [
  // Cluster Left
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 },
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
  // Cluster Right
  { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 },
  { row: 5, col: 6 }, { row: 5, col: 7 }, { row: 5, col: 8 },
]

const ROWS = 6
const COLS = 9
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function deskKey(row, col) { return `${row}-${col}` }

function getPairColor(memberName, pairs) {
  const pair = pairs.find(p => (p.members || []).includes(memberName))
  if (!pair) return null
  return PAIR_COLOR_CLASSES[PAIR_COLORS[pair.color_idx ?? 0] || 'violet']
}

function DayFloorGrid({ date, dayLabel, members, pairs = [], overrides, onDeskClick, isToday }) {
  const deskSet = new Set(DESK_SLOTS.map(d => deskKey(d.row, d.col)))

  const memberByDesk = {}
  members.forEach(m => {
    if (m.desk_row != null && m.desk_col != null) {
      memberByDesk[deskKey(m.desk_row, m.desk_col)] = m
    }
  })

  const wfoCount = members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfo').length
  const wfhCount = members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfh').length
  const leaveCount = members.filter(m => getAttendanceStatus(m, date, overrides) === 'leave').length

  const cells = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = deskKey(row, col)
      const hasDesk = deskSet.has(key)
      const member = memberByDesk[key]

      if (!hasDesk) { cells.push(<div key={key} />); continue }

      if (!member) {
        cells.push(
          <div
            key={key}
            className={`border-2 border-dashed rounded-lg flex items-center justify-center text-xs transition-colors
              ${onDeskClick
                ? 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500 cursor-pointer text-gray-300'
                : 'border-gray-200 text-gray-200 cursor-default'}`}
            onClick={() => onDeskClick && onDeskClick(null, { row, col }, date)}
            title={onDeskClick ? 'Click to add member' : undefined}
          >
            +
          </div>
        )
        continue
      }

      const status = getAttendanceStatus(member, date, overrides)
      const pairColor = status === 'wfo' ? getPairColor(member.name, pairs) : null
      const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      const firstName = member.name.split(' ')[0]

      let chipClass = ''
      let chipStyle = {}
      if (pairColor) {
        chipClass = `border rounded-lg cursor-pointer hover:opacity-80 transition-opacity`
        chipStyle = { background: pairColor.bg.replace('bg-', ''), borderColor: '' }
        // use inline via Tailwind class
        chipClass = `${pairColor.bg} ${pairColor.text} border ${pairColor.border} rounded-lg cursor-pointer hover:opacity-80 transition-opacity`
      } else if (status === 'wfo') {
        chipClass = 'bg-emerald-500 text-white rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
      } else if (status === 'leave') {
        chipClass = 'bg-amber-400 text-white rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
      } else {
        chipClass = 'bg-gray-100 text-gray-400 rounded-lg cursor-pointer hover:opacity-80 transition-opacity'
      }

      cells.push(
        <div
          key={key}
          title={`${member.name} — ${status.toUpperCase()}`}
          className={`flex flex-col items-center justify-center p-1 ${chipClass}`}
          onClick={() => onDeskClick && onDeskClick(member, date)}
        >
          <span className="text-sm font-bold leading-none">{initials}</span>
          <span className="truncate w-full text-center leading-none mt-0.5" style={{ fontSize: '9px' }}>
            {firstName}
          </span>
          <span className="leading-none mt-0.5 font-semibold" style={{ fontSize: '8px', opacity: 0.75 }}>
            {status === 'leave' ? 'LEAVE' : status.toUpperCase()}
          </span>
        </div>
      )
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${isToday ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 bg-white'}`}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isToday ? 'text-emerald-700' : 'text-gray-800'}`}>
            {dayLabel}
          </span>
          <span className={`text-xs font-mono ${isToday ? 'text-emerald-500' : 'text-gray-400'}`}>
            {date.getDate()}/{date.getMonth() + 1}
          </span>
          {isToday && (
            <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">today</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {wfoCount > 0 && <span className="text-emerald-600 font-semibold">{wfoCount} WFO</span>}
          {leaveCount > 0 && <span className="text-amber-600 font-semibold">{leaveCount} leave</span>}
          {wfhCount > 0 && <span className="text-gray-400">{wfhCount} WFH</span>}
        </div>
      </div>

      {/* Floor grid */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, 44px)`,
        }}
      >
        {cells}
      </div>
    </div>
  )
}

export default function FloorView({ members, pairs = [], overrides, selectedDate, weekDates, onDeskClick }) {
  const todayStr = formatDate(new Date())

  // Week mode: render 5 day grids
  if (weekDates && weekDates.length > 0) {
    return (
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> WFO</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> WFH</span>
          {pairs.length > 0 && pairs.map(pair => {
            const cls = PAIR_COLOR_CLASSES[PAIR_COLORS[pair.color_idx ?? 0] || 'violet']
            return (
              <span key={pair.id} className={`flex items-center gap-1.5`}>
                <span className={`w-3 h-3 rounded ${cls.dot} inline-block`} />
                {pair.name}
              </span>
            )
          })}
        </div>

        {weekDates.map((date, i) => (
          <DayFloorGrid
            key={formatDate(date)}
            date={date}
            dayLabel={DAY_LABELS[i]}
            members={members}
            pairs={pairs}
            overrides={overrides}
            onDeskClick={onDeskClick}
            isToday={formatDate(date) === todayStr}
          />
        ))}
      </div>
    )
  }

  // Single-day mode (fallback)
  const date = selectedDate || new Date()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> WFO</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> WFH</span>
      </div>
      <DayFloorGrid
        date={date}
        dayLabel={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        members={members}
        pairs={pairs}
        overrides={overrides}
        onDeskClick={onDeskClick}
        isToday={formatDate(date) === todayStr}
      />
    </div>
  )
}
