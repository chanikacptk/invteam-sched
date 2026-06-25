import { getAttendanceStatus, formatDate, getHoliday, PAIR_COLORS, PAIR_COLOR_CLASSES } from '../../lib/scheduleUtils'

const MAX_AVATARS = 5

function getAvatarClass(memberName, pairs) {
  const pair = pairs.find(p => (p.members || []).includes(memberName))
  if (pair) {
    const colorName = PAIR_COLORS[pair.color_idx ?? 0] || 'violet'
    return PAIR_COLOR_CLASSES[colorName].dot
  }
  return 'bg-emerald-500'
}

export default function MonthCalendar({ members, pairs = [], overrides, holidays, year, month, onDayClick }) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7 // Monday-first

  const todayStr = formatDate(new Date())
  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">{monthName}</div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
        {days.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className="bg-white min-h-[72px]" />

          const dateStr = formatDate(date)
          const isToday = dateStr === todayStr
          const dow = date.getDay() // 0=Sun, 6=Sat
          const isWeekend = dow === 0 || dow === 6
          const isFriday = dow === 5
          const holiday = getHoliday(date, holidays)

          const wfoMembers = (!isWeekend && !isFriday && !holiday)
            ? members.filter(m => getAttendanceStatus(m, date, overrides, holidays) === 'wfo')
            : []
          const shown = wfoMembers.slice(0, MAX_AVATARS)
          const extra = wfoMembers.length - MAX_AVATARS

          return (
            <div
              key={dateStr}
              className={`bg-white min-h-[72px] p-1.5 flex flex-col cursor-pointer transition-colors
                ${isWeekend || isFriday ? 'opacity-40 cursor-default' : 'hover:bg-gray-50'}
                ${holiday ? 'bg-sky-50' : ''}
                ${isToday ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
              onClick={() => (!isWeekend && !isFriday) && onDayClick && onDayClick(date)}
            >
              <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-emerald-700' : holiday ? 'text-sky-600' : 'text-gray-600'}`}>
                {date.getDate()}
              </div>

              {holiday && (
                <div className="text-xs text-sky-600 leading-tight truncate" title={holiday.name_en}>{holiday.name_en}</div>
              )}

              {/* Avatar initials row */}
              {shown.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {shown.map(m => {
                    const initials = m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const avatarBg = getAvatarClass(m.name, pairs)
                    return (
                      <span
                        key={m.id}
                        title={m.name}
                        className={`w-5 h-5 rounded-full text-white flex items-center justify-center font-bold ${avatarBg}`}
                        style={{ fontSize: '8px' }}
                      >
                        {initials}
                      </span>
                    )
                  })}
                  {extra > 0 && (
                    <span
                      className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold"
                      style={{ fontSize: '8px' }}
                    >
                      +{extra}
                    </span>
                  )}
                </div>
              )}

              {/* Friday label */}
              {isFriday && (
                <div className="text-xs text-gray-300 mt-auto">WFH</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
