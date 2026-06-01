import { getAttendanceStatus, getWeekDates, formatDate, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function getMemberCardClass(memberName, status, pairs) {
  if (status === 'leave') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (status === 'wfh') return 'bg-gray-50 text-gray-400 border border-gray-100'
  if (status === 'wfo') {
    const pair = pairs.find(p => (p.members || []).includes(memberName))
    if (pair) {
      const colorName = PAIR_COLORS[pair.color_idx ?? 0] || 'violet'
      const cls = PAIR_COLOR_CLASSES[colorName]
      return `${cls.bg} ${cls.text}`
    }
    return 'bg-emerald-50 text-emerald-700'
  }
  return 'bg-gray-50 text-gray-400'
}

export default function WeekCalendar({ members, pairs = [], overrides, weekStart, onDayClick }) {
  const weekDates = getWeekDates(weekStart)
  const todayStr = formatDate(new Date())

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-5 divide-x divide-gray-100">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date)
          const isToday = dateStr === todayStr
          const isFriday = i === 4

          const wfoMembers   = isFriday ? [] : members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfo')
          const leaveMembers = isFriday ? [] : members.filter(m => getAttendanceStatus(m, date, overrides) === 'leave')
          const wfhMembers   = isFriday ? members : members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfh')

          return (
            <div
              key={dateStr}
              className={`p-3 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors
                ${isToday ? 'bg-emerald-50 hover:bg-emerald-50' : ''}`}
              onClick={() => onDayClick && onDayClick(date)}
            >
              {/* Header */}
              <div className="mb-2">
                <div className={`text-xs font-semibold ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {DAY_LABELS[i]}
                </div>
                <div className={`text-lg font-bold leading-none mt-0.5 ${isToday ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {date.getDate()}
                </div>
              </div>

              {/* Friday — full team WFH */}
              {isFriday ? (
                <div className="space-y-1">
                  {members.map(m => (
                    <div key={m.id} className="text-xs rounded px-1.5 py-0.5 truncate bg-gray-50 text-gray-400 border border-gray-100">
                      {m.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* WFO — colored */}
                  {wfoMembers.map(m => (
                    <div
                      key={m.id}
                      className={`text-xs rounded px-1.5 py-0.5 truncate font-medium ${getMemberCardClass(m.name, 'wfo', pairs)}`}
                    >
                      {m.name}
                    </div>
                  ))}
                  {/* Leave — amber */}
                  {leaveMembers.map(m => (
                    <div
                      key={m.id}
                      className="text-xs rounded px-1.5 py-0.5 truncate font-medium bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {m.name} ✦
                    </div>
                  ))}
                  {/* Divider between WFO and WFH */}
                  {wfhMembers.length > 0 && (wfoMembers.length > 0 || leaveMembers.length > 0) && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  {/* WFH — gray */}
                  {wfhMembers.map(m => (
                    <div
                      key={m.id}
                      className="text-xs rounded px-1.5 py-0.5 truncate text-gray-400 bg-gray-50 border border-gray-100"
                    >
                      {m.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
