import { useState } from 'react'
import { getAttendanceStatus, getWeekDates, formatDate } from '../../lib/scheduleUtils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function WeekOverviewTable({ members, overrides, weekStart }) {
  const [drillDown, setDrillDown] = useState(null) // { dayIdx, status }
  const weekDates = getWeekDates(weekStart)

  const stats = weekDates.map(date => {
    const wfo = members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfo')
    const wfh = members.filter(m => getAttendanceStatus(m, date, overrides) === 'wfh')
    const leave = members.filter(m => getAttendanceStatus(m, date, overrides) === 'leave')
    return { wfo, wfh, leave }
  })

  const drillMembers = drillDown
    ? stats[drillDown.dayIdx][drillDown.status]
    : []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">Weekly Overview</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 w-24"> </th>
              {DAY_LABELS.map(d => (
                <th key={d} className="px-3 py-2 text-xs font-semibold text-gray-500">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key: 'wfo', label: 'In office', colorClass: 'text-emerald-600' },
              { key: 'wfh', label: 'WFH', colorClass: 'text-gray-500' },
              { key: 'leave', label: 'On leave', colorClass: 'text-amber-600' },
            ].map(({ key, label, colorClass }) => (
              <tr key={key} className="border-b border-gray-50">
                <td className="px-4 py-2 text-xs font-medium text-gray-500">{label}</td>
                {stats.map((day, i) => (
                  <td key={i} className="px-3 py-2 text-center">
                    <button
                      className={`text-sm font-bold ${colorClass} hover:underline`}
                      onClick={() => setDrillDown(
                        drillDown?.dayIdx === i && drillDown?.status === key ? null : { dayIdx: i, status: key }
                      )}
                    >
                      {day[key].length}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-4 py-2 text-xs font-semibold text-gray-600">Total</td>
              {stats.map((day, i) => (
                <td key={i} className="px-3 py-2 text-center text-sm font-semibold text-gray-700">
                  {members.length}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {drillDown && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            {DAY_LABELS[drillDown.dayIdx]} — {drillDown.status === 'wfo' ? 'In Office' : drillDown.status === 'wfh' ? 'WFH' : 'On Leave'}
          </div>
          {drillMembers.length === 0 ? (
            <div className="text-xs text-gray-400">No one in this category</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {drillMembers.map(m => (
                <span key={m.id} className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-700 font-medium">
                  {m.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
