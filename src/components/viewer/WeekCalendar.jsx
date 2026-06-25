import { getAttendanceStatus, getWeekDates, formatDate, getHoliday } from '../../lib/scheduleUtils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const STATUS_CLASS = {
  wfo:     'bg-emerald-50 text-emerald-700',
  leave:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  wfh:     'bg-gray-50 text-gray-400',
  holiday: 'bg-sky-50 text-sky-700',
}

export default function WeekCalendar({ members, overrides, holidays, weekStart, onDayClick }) {
  const weekDates = getWeekDates(weekStart)
  const todayStr = formatDate(new Date())

  // Sort all members alphabetically once, reused every day
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-5 divide-x divide-gray-100">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date)
          const isToday = dateStr === todayStr
          const isFriday = i === 4
          const holiday = getHoliday(date, holidays)

          return (
            <div
              key={dateStr}
              className={`p-3 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors
                ${isToday ? 'bg-emerald-50 hover:bg-emerald-50' : holiday ? 'bg-sky-50/60' : ''}`}
              onClick={() => onDayClick && onDayClick(date)}
            >
              {/* Header */}
              <div className="mb-2">
                <div className={`text-xs font-semibold ${isToday ? 'text-emerald-600' : holiday ? 'text-sky-600' : 'text-gray-400'}`}>
                  {DAY_LABELS[i]}
                </div>
                <div className={`text-lg font-bold leading-none mt-0.5 ${isToday ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {date.getDate()}
                </div>
                {holiday && (
                  <div className="text-xs text-sky-600 font-medium mt-1 truncate" title={holiday.name_en}>{holiday.name_en}</div>
                )}
              </div>

              {/* Names — single A-Z list, colored by status */}
              <div className="space-y-1">
                {sortedMembers.map(m => {
                  const status = isFriday ? 'wfh' : getAttendanceStatus(m, date, overrides, holidays)
                  return (
                    <div
                      key={m.id}
                      className={`text-xs rounded px-1.5 py-0.5 truncate font-medium ${STATUS_CLASS[status]}`}
                    >
                      {m.name}{status === 'leave' ? ' ✦' : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
