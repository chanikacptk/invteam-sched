import { getAttendanceStatus, formatDate, getHoliday } from '../../lib/scheduleUtils'

// Fixed 2-row seating layout. null = black separator dot between clusters.
// Names must match member.name in DB (case-insensitive, spaces stripped for lookup).
const SEAT_ROWS = [
  ['Aoi', 'Rynn', 'Beam', 'Anne', 'Palm', 'Nan', null, '_', null, 'Som-O', 'Pang'],
  ['Bank', 'Yot', 'Beam JR', null, 'Yada', 'Sai', null, 'Chanika', 'Apinya', 'Mix'],
]

function normName(n) { return n.toLowerCase().replace(/\s+/g, '') }

function statusDotClass(status) {
  if (status === 'wfo')     return 'bg-emerald-500'
  if (status === 'leave')   return 'bg-amber-400'
  if (status === 'holiday') return 'bg-sky-400'
  return 'bg-gray-200' // wfh — light grey
}

function SeatGrid({ members, date, overrides, holidays, isFriday }) {
  const byName = {}
  members.forEach(m => { byName[normName(m.name)] = m })

  return (
    <div className="flex flex-col gap-[2px] mt-1">
      {SEAT_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[1px] items-center">
          {row.map((slot, si) => {
            if (slot === null) {
              return <span key={`sep-${si}`} className="w-4 h-4 rounded-full bg-gray-800 flex-shrink-0" />
            }
            if (slot === '_') {
              return <span key={`empty-${si}`} className="w-4 h-4 rounded-full border border-dashed border-gray-200 flex-shrink-0" />
            }
            const member = byName[normName(slot)]
            if (!member) {
              return <span key={slot} className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
            }
            const status = isFriday ? 'wfh' : getAttendanceStatus(member, date, overrides, holidays)
            const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <span
                key={slot}
                title={`${member.name}: ${status.toUpperCase()}`}
                className={`w-4 h-4 rounded-full flex-shrink-0 text-white flex items-center justify-center font-bold ${statusDotClass(status)}`}
                style={{ fontSize: '7px' }}
              >
                {initials}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function MonthCalendar({ members, pairs = [], overrides, holidays, year, month, onDayClick }) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  const todayStr  = formatDate(new Date())
  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Build Mon–Fri weeks
  const weeks = []
  let currentWeek = []
  const startOffset = (firstDay.getDay() + 6) % 7
  const calStart = new Date(firstDay)
  calStart.setDate(calStart.getDate() - startOffset)
  const calEnd = new Date(lastDay)
  const endOffset = (lastDay.getDay() + 6) % 7
  calEnd.setDate(calEnd.getDate() + (4 - endOffset))

  const cur = new Date(calStart)
  while (cur <= calEnd) {
    const dow = cur.getDay()
    if (dow >= 1 && dow <= 5) {
      currentWeek.push(new Date(cur))
      if (dow === 5) { weeks.push(currentWeek); currentWeek = [] }
    }
    cur.setDate(cur.getDate() + 1)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">{monthName}</div>

      <div className="grid grid-cols-5 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
            {week.map((date) => {
              const dateStr = formatDate(date)
              const isToday = dateStr === todayStr
              const isFriday = date.getDay() === 5
              const inMonth = date.getMonth() === month
              const holiday = getHoliday(date, holidays)

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
                  <div className={`text-xs font-semibold ${isToday ? 'text-emerald-700' : holiday ? 'text-sky-600' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>

                  {holiday && (
                    <div className="text-xs text-sky-600 leading-tight truncate" title={holiday.name_en}>
                      {holiday.name_en}
                    </div>
                  )}

                  {isFriday && !holiday && (
                    <div className="text-xs text-gray-300 mt-0.5">WFH</div>
                  )}

                  <SeatGrid
                    members={members}
                    date={date}
                    overrides={overrides}
                    holidays={holidays}
                    isFriday={isFriday}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 justify-end">
        {[
          { label: 'WFO',     cls: 'bg-emerald-500' },
          { label: 'WFH',     cls: 'bg-gray-200 border border-gray-300' },
          { label: 'Leave',   cls: 'bg-amber-400' },
          { label: 'Holiday', cls: 'bg-sky-400' },
          { label: 'Cluster separator', cls: 'bg-gray-800' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
