import { getAttendanceStatus, getWeekDates, formatDate } from '../../lib/scheduleUtils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function StatsBar({ members, overrides, selectedDate }) {
  const weekDates = getWeekDates(selectedDate)
  const todayStr = formatDate(new Date())

  const stats = weekDates.map((date, i) => {
    const dateStr = formatDate(date)
    const wfo = members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfo').length
    const leave = members.filter(m => getAttendanceStatus(m, date, overrides) === 'leave').length
    const isToday = dateStr === todayStr
    return { label: DAY_LABELS[i], wfo, leave, isToday }
  })

  return (
    <div className="flex gap-3">
      {stats.map(({ label, wfo, leave, isToday }) => (
        <div
          key={label}
          className={`flex-1 rounded-xl border p-3 text-center shadow-sm transition-colors
            ${isToday ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}
        >
          <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>
            {label}
          </div>
          <div className={`text-2xl font-bold ${isToday ? 'text-emerald-700' : 'text-emerald-600'}`}>{wfo}</div>
          <div className="text-xs text-gray-400 mt-0.5">in office</div>
          {leave > 0 && <div className="text-xs text-amber-500 mt-0.5">{leave} on leave</div>}
        </div>
      ))}
    </div>
  )
}
