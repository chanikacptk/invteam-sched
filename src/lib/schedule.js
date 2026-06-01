export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const PAT = {
  MW: { mon: 1, wed: 1, thu: 0 },
  MT: { mon: 1, wed: 0, thu: 1 },
  WT: { mon: 0, wed: 1, thu: 1 },
}

export function getWeekIndex(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return ((weekNum - 1) % 4 + 4) % 4
}

export function isInOffice(member, dayKey, weekIndex) {
  if (dayKey === 'tue') return true
  if (dayKey === 'fri' || dayKey === 'sat' || dayKey === 'sun') return false
  if ((member.fixed_days || []).includes(dayKey)) return true
  const pattern = (member.rotation || [])[weekIndex % 4]
  if (!pattern || !PAT[pattern]) return false
  return PAT[pattern][dayKey] === 1
}

export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

export function getAttendanceStatus(member, date, overrides) {
  const override = (overrides || []).find(
    o => o.member_id === member.id && o.date === formatDate(date)
  )
  if (override) return override.status

  const dayKey = DAY_KEYS[date.getDay()]
  const weekIndex = getWeekIndex(date)
  return isInOffice(member, dayKey, weekIndex) ? 'wfo' : 'wfh'
}

export function getWeekDates(referenceDate) {
  const d = new Date(referenceDate)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

export const PAIR_COLORS = [
  'violet', 'pink', 'cyan', 'orange', 'amber', 'red'
]

export const PAIR_COLOR_CLASSES = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-300',   dot: 'bg-pink-500' },
  cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-700',   border: 'border-cyan-300',   dot: 'bg-cyan-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500' },
}
