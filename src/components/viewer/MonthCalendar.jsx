import { getAttendanceStatus, formatDate, getHoliday, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

const STATUS_DOT = {
  wfo:     'bg-emerald-500',
  wfh:     'bg-gray-300',
  leave:   'bg-amber-400',
  holiday: 'bg-sky-400',
}

function getMemberChipClass(member, status, pairs) {
  if (status === 'wfo') {
    const pair = pairs.find(p => (p.members || []).includes(member.name))
    if (pair) {
      const colorName = PAIR_COLORS[pair.color_idx ?? 0] || 'violet'
      return PAIR_COLOR_CLASSES[colorName].dot
    }
    return 'bg-emerald-500'
  }
  return STATUS_DOT[status] || 'bg-gray-300'
}

export default function MonthCalendar({ members, pairs = [], overrides, holidays, year, month, onDayClick }) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  const todayStr  = formatDate(new Date())
  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Build Mon–Fri only days for the month
  const weeks = []
  let currentWeek = []

  // Find the Monday of the week containing firstDay
  const startOffset = (firstDay.getDay() + 6) % 7 // 0=Mon
  const calStart = new Date(firstDay)
  calStart.setDate(calStart.getDate() - startOffset)

  const calEnd = new Date(lastDay)
  const endOffset = (lastDay.getDay() + 6) % 7
  calEnd.setDate(calEnd.getDate() + (4 - endOffset)) // advance to Friday of last week

  const cur = new Date(calStart)
  while (cur <= calEnd) {
    const dow = cur.getDay() // 0=Sun,1=Mon,...,6=Sat
    if (dow >= 1 && dow <= 5) { // Mon–Fri only
      currentWeek.push(new Date(cur))
      if (dow === 5) { // end of Mon–Fri week
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">{monthName}</div>

      {/* Day headers — Mon to Fri only */}
      <div className="grid grid-cols-5 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
            {week.map((date) => {
              const dateStr    = formatDate(date)
              const isToday    = dateStr === todayStr
              const isFriday   = date.getDay() === 5
              const inMonth    = date.getMonth() === month
              const holiday    = getHoliday(date, holidays)

              const allStatuses = members.map(m => ({
                member: m,
                status: getAttendanceStatus(m, date, overrides, holidays),
              }))

              return (
                <div
                  key={dateStr}
                  className={`bg-white min-h-[80px] p-1.5 flex flex-col transition-colors
                    ${!inMonth ? 'opacity-30' : ''}
                    ${isFriday ? 'bg-gray-50' : ''}
                    ${holiday ? 'bg-sky-50' : ''}
                    ${isToday ? 'ring-2 ring-inset ring-emerald-500' : ''}
                    ${inMonth && !isFriday ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                  `}
                  onClick={() => inMonth && !isFriday && onDayClick && onDayClick(date)}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-emerald-700' : holiday ? 'text-sky-600' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>

                  {holiday && (
                    <div className="text-xs text-sky-600 leading-tight truncate mb-0.5" title={holiday.name_en}>
                      {holiday.name_en}
                    </div>
                  )}

                  {isFriday && !holiday && (
                    <div className="text-xs text-gray-300">WFH</div>
                  )}

                  {/* All members as small colored dots */}
                  {!isFriday && (
                    <div className="flex flex-wrap gap-[2px] mt-0.5">
                      {allStatuses.map(({ member, status }) => {
                        const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                        const chipBg   = getMemberChipClass(member, status, pairs)
                        return (
                          <span
                            key={member.id}
                            title={`${member.name}: ${status.toUpperCase()}`}
                            className={`w-4 h-4 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 ${chipBg}`}
                            style={{ fontSize: '7px' }}
                          >
                            {initials}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-end">
        {[
          { label: 'WFO',     cls: 'bg-emerald-500' },
          { label: 'WFH',     cls: 'bg-gray-300' },
          { label: 'Leave',   cls: 'bg-amber-400' },
          { label: 'Holiday', cls: 'bg-sky-400' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
