# Team Attendance Web App — CLAUDE.md

## Project Overview
Internal web app for Inventory team (16 members) to manage and view weekly office attendance schedule. Admin can configure schedules; team members view via public link with no login required.

**Status:** Built and deployed.
**Production URL:** https://invteamv2.vercel.app
**Admin URL:** https://invteamv2.vercel.app/admin

---

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev, component-based, Claude Code friendly |
| Styling | Tailwind CSS | Utility-first, no CSS files to manage |
| Database | Supabase | Free tier, real-time updates, built-in Auth |
| Hosting | Vercel | Free, deployed via `vercel --prod` CLI |

---

## Repository Structure
```
team-attendance/
├── CLAUDE.md
├── package.json
├── vite.config.js
├── tailwind.config.js          ← extended with fade-in keyframe/animation
├── vercel.json                 ← SPA rewrite: all routes → /index.html
├── index.html                  ← title "Inventory Team Schedule", Plus Jakarta Sans font
├── .env.example
├── .env.local                   ← actual keys (gitignored via *.local)
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                 ← router: / = viewer, /admin (public, no auth); mounts <ToastContainer/>
    ├── lib/
    │   ├── supabase.js         ← supabase client init (named export `supabase`)
    │   └── scheduleUtils.js    ← canonical schedule logic (see below) — NOT schedule.js
    ├── hooks/
    │   ├── useMembers.js       ← { members, loading, addMember, updateMember, deleteMember, refresh }
    │   ├── usePairs.js         ← { pairs, loading, addPair, updatePair, deletePair, refresh }
    │   ├── useOverrides.js     ← { overrides, loading, setOverride, removeOverride, refresh }
    │   └── useHolidays.js      ← { holidays, loading, addHoliday, updateHoliday, toggleObserved, deleteHoliday, refresh }
    ├── pages/
    │   ├── ViewerPage.jsx      ← public
    │   └── AdminPage.jsx       ← public (no auth — see Auth section)
    └── components/
        ├── Toast.jsx           ← toast(message, type) + <ToastContainer/>, auto-dismiss 3s
        ├── Skeleton.jsx        ← StatsBarSkeleton, ListSkeleton (loading states)
        ├── viewer/
        │   ├── StatsBar.jsx        ← props: members, overrides, holidays, selectedDate
        │   ├── MonthCalendar.jsx   ← props: members, pairs, overrides, holidays, year, month, onDayClick
        │   ├── WeekCalendar.jsx    ← props: members, overrides, holidays, weekStart, onDayClick — reused by AdminPage's Floor/Week toggle too
        │   └── FloorView.jsx       ← props: members, pairs, overrides, holidays, selectedDate OR weekDates, onDeskClick
        │                             exports DESK_SLOTS
        └── admin/
            ├── MemberList.jsx      ← pair badge, desk chip, week schedule dots, inline delete confirm
            ├── MemberModal.jsx     ← desk dropdown from DESK_SLOTS, day checkboxes → rotation pattern
            ├── PairList.jsx
            ├── PairModal.jsx
            ├── OverridePanel.jsx   ← slide-in right panel; info box + Reset to schedule button; props now include `holidays`
            ├── WeekOverviewTable.jsx ← props: members, overrides, holidays, weekStart; clickable drill-down
            └── HolidayList.jsx     ← Holidays admin tab; per-year tabs, toggle is_observed switch, add/delete custom holiday
```

---

## Database Schema (Supabase)

### Table: `members`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null
fixed_days  text[] default '{}'   -- e.g. ['mon'] for always-Monday
rotation    text[] not null        -- 4 elements: ['MW','MW','MT','MT']
desk_row    int                    -- 0-5 (physical desk position)
desk_col    int                    -- 0-8 (physical desk position)
cluster     text                   -- 'A' or 'B' (derived from desk_row)
created_at  timestamptz default now()
```

### Table: `pairs`
```sql
id          uuid primary key default gen_random_uuid()
name        text not null           -- e.g. 'Beam & Anne'
members     text[] not null         -- array of member names
color_idx   int default 0           -- index into PAIR_COLORS array
created_at  timestamptz default now()
```

### Row Level Security (RLS)
```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read members" ON members FOR SELECT USING (true);
CREATE POLICY "public write members" ON members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pairs" ON pairs FOR SELECT USING (true);
CREATE POLICY "public write pairs" ON pairs FOR ALL USING (true) WITH CHECK (true);
```
(Originally `authenticated`-only write policies — opened to public in the 2026-06-25 auth removal, see Auth section.)

### Table: `holidays`
```sql
id          uuid primary key default gen_random_uuid()
date        date not null unique
name_th     text not null
name_en     text not null
is_observed boolean not null default true   -- admin toggle: does the company actually close on this date?
created_at  timestamptz default now()
```
RLS: public read, public write (same pattern as `members`/`pairs` — opened up 2026-06-25, see Auth section).
Migration + seed data (fixed-date national holidays only, 2026–2028): `team-attendance/supabase/holidays_migration.sql`. Lunar/Buddhist holidays (Makha Bucha, Visakha Bucha, Asahna Bucha, substitution days) are **not** seeded — their dates shift yearly; add them from Admin → Holidays once the Cabinet announces each year's dates.

### Realtime
Tables must be added to the `supabase_realtime` publication for live updates to work:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE pairs;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE holidays;
```
(Or via Dashboard → Database → Publications → `supabase_realtime` → toggle each table.)

---

## Auth
**Removed 2026-06-25.** `/admin` is now public with no login — same as `/` — because the password was lost and re-adding auth wasn't worth the friction for a 16-person internal tool. There is no `useAuth`, `LoginPage`, or `/login` route anymore; both routes read/write via the Supabase anon key.
- Migration: `team-attendance/supabase/open_admin_writes_migration.sql` — replaces every `auth.role() = 'authenticated'` write policy (`members`, `pairs`, `attendance_overrides`, `holidays`, `draft_changes`) with `USING (true) WITH CHECK (true)`, and adds a public SELECT policy on `draft_changes` (previously admin-only read). Idempotent (drops both the old `admin write *` and `public write *` policy names before recreating, so it's safe to re-run after a partial prior run). **Confirmed applied to production Supabase and verified working** — tested a live override write/reset round-trip against production data on 2026-06-25.
- Deployed to production the same day (`npx vercel --prod` → aliased to https://invteamv2.vercel.app).
- **Security tradeoff, accepted knowingly:** anyone with the site URL and the anon key (visible in any browser's network tab) can now write to these tables directly via the Supabase REST API, not just through the `/admin` UI. There is no remaining boundary between "can view the schedule" and "can edit it." Acceptable for this tool's threat model (small internal team, no sensitive data) but do not extend this pattern to a project with real stakes without reconsidering.

---

## Schedule Logic (`src/lib/scheduleUtils.js`)

### Rotation Patterns
Every member has a `rotation` array of 4 pattern strings, one per week (cycles: Week 1→2→3→4→1...):
```
'MW' = Mon + Wed in office (+ always Tue)
'MT' = Mon + Thu in office (+ always Tue)
'WT' = Wed + Thu in office (+ always Tue)
```

### Rules (hardcoded)
- **Tuesday**: Full team in office, always
- **Friday**: Full team WFH, always
- **Fixed days**: If a member has `fixed_days: ['mon']`, they are always in office on Monday regardless of rotation pattern
- **Wednesday rotation** (effective 2026-07-08): Wednesday is now controlled by a fixed 4-group rotation via `attendance_overrides`, completely overriding the MW/MT/WT rotation for Wednesday. See section below.

### formatDate — timezone-safe (IMPORTANT)
`formatDate` must use **local** date components, never `toISOString()`. Thailand is UTC+7; `toISOString()` converts to UTC first and can shift the date backward by one day, causing overrides to save/lookup against the wrong date.
```js
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

### Week Index Calculation
```js
function getWeekIndex(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return ((weekNum - 1) % 4 + 4) % 4  // 0-3
}
```

### isInOffice Function
```js
function isInOffice(member, dayKey, weekIndex) {
  if (dayKey === 'tue') return true
  if (dayKey === 'fri' || dayKey === 'sat' || dayKey === 'sun') return false
  if (member.fixed_days.includes(dayKey)) return true
  const pattern = member.rotation[weekIndex % 4]
  const PAT = { MW: {mon:1,wed:1,thu:0}, MT: {mon:1,wed:0,thu:1}, WT: {mon:0,wed:1,thu:1} }
  return PAT[pattern][dayKey] === 1
}
```

### getWeekDates
Returns 5 `Date` objects (Mon–Fri) for the week containing `referenceDate`. Used everywhere a weekly view is rendered.

### Other exports
`DAY_KEYS`, `PAIR_COLORS` (`['violet','pink','cyan','orange','amber','red']`), `PAIR_COLOR_CLASSES` (Tailwind class map per color: `bg`, `text`, `border`, `dot`), `STATUS_COLOR_CLASSES` / `STATUS_LABELS` (per-status `bg`/`text`/`dot` and display label, keys: `wfo`/`wfh`/`leave`/`holiday`), `getHoliday(date, holidays)` (returns the matching observed holiday row or `null`).

---

## Current Team Rotation (reference — actual data lives in Supabase)
| Member | fixed_days | rotation |
|---|---|---|
| Beam, Anne | `['mon']` | `['MW','MW','MT','MT']` (paired — always same days) |
| Nan | `['mon']` | `['MW','MT','MW','MT']` |
| Palm | `['mon']` | `['MT','MW','MT','MW']` |
| Bank, Yot | `[]` | `['WT','WT','MW','MW']` (paired — `fixed_days ['wed']` removed 2026-07-01, Wednesday now controlled by Wednesday rotation overrides) |
| Aoi, Rynn, Beam JR, Yada, Sai, Som-O, Pang, Chanika, Apinya, Mix | `[]` | individual 4-week rotations, see SQL history |

---

## Desk Layout
Hardcoded in `FloorView.jsx` (not stored in DB) — reflects the physical office floor plan.

**Layout: 9 cols x 6 rows**
```
CLUSTER LEFT (rows 0-1, cols 0-5):    12 desks
(gap — rows 2-3 fully empty)
CLUSTER RIGHT (rows 4-5, cols 6-8):    6 desks
```
Total: 18 desk slots, exported as `DESK_SLOTS` from `FloorView.jsx`.

**FloorView behavior:**
- Accepts either `selectedDate` (single day) or `weekDates` (array of 5 — renders one grid per day, Mon–Fri, stacked vertically with day header + WFO/leave/WFH summary counts)
- Member chip: colored by status (emerald=WFO, amber=leave, gray=WFH) or by pair color if WFO and paired
- Empty desk slot: dashed border, shows `+` on hover when `onDeskClick` is provided (admin only) — clicking opens MemberModal pre-filled with that desk position
- Member chip click → `onDeskClick(member, date)` (admin: opens OverridePanel for that specific day)
- Viewer page: not clickable (no `onDeskClick` passed)

---

## Daily Override Feature

### Database Table: `attendance_overrides`
```sql
id          uuid primary key default gen_random_uuid()
member_id   uuid references members(id) on delete cascade
date        date not null
status      text not null check (status in ('wfo','wfh','leave'))
note        text
created_by  uuid references auth.users(id)
created_at  timestamptz default now()
unique(member_id, date)
```

### RLS
```sql
ALTER TABLE attendance_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read overrides" ON attendance_overrides FOR SELECT USING (true);
CREATE POLICY "public write overrides" ON attendance_overrides FOR ALL USING (true) WITH CHECK (true);
```
(Originally `authenticated`-only write policy — opened to public 2026-06-25, see Auth section.)

### Override Logic — `getAttendanceStatus(member, date, overrides, holidays)`
```js
function getAttendanceStatus(member, date, overrides, holidays) {
  const override = overrides.find(o => o.member_id === member.id && o.date === formatDate(date))
  if (override) return override.status  // 'wfo' | 'wfh' | 'leave' — always wins, even on an observed holiday
  if (getHoliday(date, holidays)) return 'holiday'  // observed company holiday, no per-member override
  const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][date.getDay()]
  const weekIndex = getWeekIndex(date)
  return isInOffice(member, dayKey, weekIndex) ? 'wfo' : 'wfh'
}
```
**Precedence: per-member override > observed holiday > normal rotation/fixed-day schedule.** Every call site that renders attendance must pass `holidays` as the 4th arg — passing only 3 args silently treats every day as non-holiday.

### Status Colors
| Status    | Color |
|-----------|-------|
| `wfo`     | emerald |
| `wfh`     | gray |
| `leave`   | amber |
| `holiday` | sky |

### `useOverrides({ from, to })` hook
- Accepts a **date-range object**, not positional args: `useOverrides({ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' })`
- Returns `{ overrides, loading, setOverride, removeOverride, refresh }`
- `setOverride(memberId, date, status, note)` — optimistic local update immediately, then upserts to Supabase, then re-fetches to sync. On error: toasts + reverts via refetch.
- `removeOverride(memberId, date)` — optimistic local remove, then deletes from Supabase.
- **IMPORTANT — date range must cover the full visible week, even across month boundaries.** If a page computes `{from, to}` using only the current month, a week like Jun 29 – Jul 3 will have its July days silently excluded. Always widen the range to `min(monthStart, weekStart)` → `max(monthEnd, weekEnd)`:
  ```js
  const weekDates = getWeekDates(selectedDate)
  const weekStart = formatDate(weekDates[0])
  const weekEnd   = formatDate(weekDates[4])
  const overrideFrom = weekStart < monthStart ? weekStart : monthStart
  const overrideTo   = weekEnd   > monthEnd   ? weekEnd   : monthEnd
  ```

### OverridePanel.jsx (slide-in, fixed right side)
Props: `{ member, date, overrides, holidays, onSet, onRemove, onClose }`
- Sky info banner if the date is an observed holiday (shown above the status box)
- Info box at top:
  - Override exists → amber box: status set, note (if any), "Schedule would be: X" (X includes `Holiday` if applicable)
  - No override → gray box: "Following schedule — WFO/WFH/Holiday"
- WFO/WFH/Leave toggle buttons + optional note input — no dedicated "Holiday" button; admin sets WFO/WFH/Leave to override a holiday for one person, the holiday itself is managed in the Holidays tab
- **"↺ Reset to schedule" button** — only rendered when an override exists for that member+date; calls `onRemove(memberId, date)` then closes the panel automatically
- "Save override" button — calls `onSet(memberId, date, status, note)` then closes

---

## Public Holidays Feature

### HolidayList.jsx (Admin → Holidays tab)
Props: `{ holidays, onAdd, onToggleObserved, onDelete }`
- Per-year filter tabs (derived from `holidays` dates, always includes the current year)
- Each row: date, English/Thai name, an emerald/gray toggle switch for `is_observed`, delete (with inline confirm)
- "+ Add holiday" inline form (date + English name required, Thai name optional) — for custom company closures not in the seeded list
- Toggling `is_observed` off does **not** delete the row — it just stops that date from forcing `'holiday'` status, so the team falls back to their normal rotation/fixed-day schedule on that date

### Where holidays show up
- **StatsBar**: on an observed holiday, the day's card shows the holiday name instead of the WFO/leave counts
- **WeekCalendar / MonthCalendar**: holiday name shown under the date, sky-blue tint
- **FloorView**: holiday name badge in the day-grid header, sky-blue desk chips for anyone still marked `'holiday'`, plus a sky legend swatch
- **WeekOverviewTable**: holiday name under the day-of-week header, plus a "Holiday" stat row
- **Viewer day-detail panel**: holiday banner + a dedicated "Holiday" group alongside In Office / On Leave / WFH

### `useHolidays()` hook
- No date-range params — fetches the full `holidays` table (small, ~15 rows/year) with a realtime subscription
- `addHoliday(holiday)` / `updateHoliday(id, updates)` / `toggleObserved(id, isObserved)` / `deleteHoliday(id)` — all optimistic-then-refetch, same pattern as `useOverrides`

### Admin Schedule Tab Layout
- StatsBar (Mon–Fri headcount, current week)
- WeekOverviewTable — In office / WFH / On leave / Total rows, click a count to drill into names
- **Floor / Week / Month toggle** (`scheduleView` state in `AdminPage.jsx`):
  - **Floor**: FloorView with `weekDates` — 5 stacked day grids, click member → OverridePanel, click empty desk → MemberModal (add member pre-filled with that desk)
  - **Week**: reuses the viewer's `WeekCalendar` (read-only A–Z name list per day) — clicking a day opens a right-side drill-down panel, clicking a name opens OverridePanel for that member+date
  - **Month**: reuses `MonthCalendar` — clicking a day opens the same day-detail drill-down panel
- Navigation (‹ ›) moves by week in Floor/Week mode, by month in Month mode
- Override data range widens to cover full month when in Month view

### Refresh button
AdminPage topbar has a **↻ Refresh** button — calls `refresh()` on members, pairs, overrides, and holidays hooks simultaneously (`Promise.all`). Icon spins while refreshing. Useful as a manual fallback if realtime/optimistic updates ever drift from server state.

### Viewer UI
- Floor view (week mode): same 5-stacked-day-grid layout as admin, but read-only (no `onDeskClick`)
- Week calendar: shows **all members every day**, not just WFO — WFO colored (emerald/pair color), Leave (amber, ✦), WFH (gray, below a divider) — so people can see at a glance which days they're WFH
- Month calendar: **Mon–Fri only** (Sat/Sun removed). Each day cell shows all 16 members as small (w-4 h-4) initials chips in a fixed 2-row hardcoded seat layout. Chip color = emerald (WFO/pair color), gray (WFH), amber (leave), sky (holiday). Today highlighted with emerald ring. Friday column shows WFH label (no chips).
- Clicking a day (week/month view) opens a right-side detail panel: In Office / On Leave / WFH lists
- No edit ability anywhere on viewer pages

---

## UI Design Spec

### Colors (Tailwind)
- Background: `white` / `gray-50` for cards
- Text primary: `gray-900`; secondary: `gray-500`
- WFO: `emerald-600` / `emerald-50`
- Leave: `amber-400` / `amber-50`
- WFH: `gray-400` / `gray-50`
- Holiday: `sky-600` / `sky-50`
- Pair colors: `[violet, pink, cyan, orange, amber, red]` via `PAIR_COLOR_CLASSES`
- `tailwind.config.js` has a `safelist` for `text-/bg-{emerald,amber,gray,sky}-{50,100,600,700,800}` — several components build status color classes dynamically (e.g. `` `text-${color}-600` ``), which Tailwind's JIT scanner can't detect from a template literal. Add new dynamic status colors to this safelist or the classes silently won't exist in the production CSS.

### Font
`Plus Jakarta Sans` from Google Fonts — imported in `index.html`. Tab title: **"Inventory Team Schedule"**.

### Toast & loading states
- `src/components/Toast.jsx` exports `toast(message, type)` (callable from any hook/component) + `<ToastContainer/>` (mounted once in `App.jsx`). Fixed bottom-center, auto-dismiss after 3s.
- All hooks (`useMembers`, `usePairs`, `useOverrides`) call `toast(error.message)` on any Supabase error.
- `src/components/Skeleton.jsx` — `StatsBarSkeleton`, `ListSkeleton` shown during initial data fetch on both Viewer and Admin pages.

### Responsive
- FloorView and WeekCalendar wrapped in `overflow-x-auto` + `min-w-[...]` inner div so they scroll horizontally on mobile instead of squashing.

---

## Environment Variables
```
VITE_SUPABASE_URL=https://kfomizcdgdqfoiypqimr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```
Note: project uses Supabase's newer `sb_publishable_...` key format, which requires an up-to-date `@supabase/supabase-js`.

---

## Deployment (Vercel)

Deployed via **Vercel CLI**, not GitHub auto-deploy (no GitHub remote connected as of last deploy).

```bash
cd team-attendance
npx vercel login        # device-code OAuth, one-time
npx vercel link         # link to existing project (invteamv2) if not already linked
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel --prod
```

- Production alias: **https://invteamv2.vercel.app**
- `vercel.json` is required for React Router to work — without it, any route other than `/` 404s on refresh:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- `.env.local` also accumulates a `VERCEL_OIDC_TOKEN` line after `vercel link`/`vercel dev` — leave it, it's harmless and gitignored.

---

## Commands
```bash
npm run dev      # local dev server (Vite picks an open port if 5173 is taken)
npm run build    # production build
npm run preview  # preview production build
npx vercel --prod  # deploy to production
```

---

## Known gotchas (fixed but worth remembering)
1. **Timezone bug** — never use `date.toISOString()` for date-string formatting; always use local `getFullYear/getMonth/getDate`. Caused overrides to silently save against the wrong day for UTC+7 users.
2. **Month-boundary override range bug** — date-range queries for overrides must span the full displayed week, not just `selectedDate`'s calendar month, or dates like the 29th–31st near a month boundary become un-overridable.
3. **Vercel SPA routing** — `/admin` 404s without `vercel.json` rewrites.
4. **Supabase key format** — `sb_publishable_...` keys need a current `@supabase/supabase-js`; older versions expect a JWT (`eyJ...`) anon key and will throw "invalid authentication credentials."
5. **Realtime requires explicit publication** — tables aren't realtime by default; must be added to `supabase_realtime` publication or the `postgres_changes` subscriptions silently no-op (mitigated by optimistic local updates in `useOverrides`/`useMembers`/`usePairs`, but cross-tab/cross-device sync still needs it).

---

## Open bugs
1. **~~Admin "↻ Refresh" doesn't always restore previous state~~ — fixed 2026-06-25.** Root cause: every write-triggered `fetchX()` and every realtime-triggered `fetchX()` raced with no sequencing; an older in-flight fetch could resolve after a newer one and overwrite fresh state with stale data. Fixed by adding a monotonic `seqRef` guard (drop the result if a newer fetch has started) in `useMembers.js`, `usePairs.js`, `useHolidays.js`, `useOverrides.js`, `useDrafts.js`. Reproduce by rapidly toggling a holiday twice then clicking Refresh — final state should now always match the last action.
2. **Override on one day allegedly stops the following week's rotation from advancing** — reported 2026-06-25, still not reproduced. `getWeekIndex` in `scheduleUtils.js` derives purely from absolute date; `attendance_overrides` rows never feed into it, so no code path connects an override to another date's computed schedule. Needs exact repro steps (member, override date, which week looked wrong) before further investigation.

## Wednesday Rotation (effective 2026-07-08)

Wednesday attendance is now fully controlled by a fixed 4-group rotation, implemented as `attendance_overrides` rows — **not** by the MW/MT/WT rotation patterns. Every Wednesday has 16 override rows: 4 WFH (the rotating group) + 12 WFO (everyone else). This means the 4-week rotation cycle has no effect on Wednesday.

### Groups
| Group | Members | WFH Wednesdays |
|-------|---------|----------------|
| 1 | Anne, Aoi, Beam, Som-O | Jul 8, Aug 5, Sep 2, Sep 30, Oct 28, Nov 25, Dec 23 |
| 2 | Rynn, Palm, Sai, Chanika | Jul 15, Aug 12, Sep 9, Oct 7, Nov 4, Dec 2, Dec 30 |
| 3 | Beam JR, Bank, Apinya, Pang | Jul 22, Aug 19, Sep 16, Oct 14, Nov 11, Dec 9 |
| 4 | Yada, Mix, Nan, Yot | Jul 29, Aug 26, Sep 23, Oct 21, Nov 18, Dec 16 |

### Migration
`supabase/wednesday_rotation_migration.sql` — idempotent, safe to re-run. Run in Supabase SQL Editor. Does:
1. Removes `'wed'` from `fixed_days` for Bank & Yot
2. Deletes any existing Wednesday rotation overrides (note = 'Wednesday rotation')
3. Inserts 16 overrides per Wednesday (4 WFH + 12 WFO) through end of 2026

When prompted by Supabase "destructive operations" dialog → choose **Run without RLS** (RLS is already enabled on `attendance_overrides`).

### MonthCalendar seat layout (hardcoded in `MonthCalendar.jsx`)
```
Row 1: Aoi · Rynn · Beam · Anne · Palm · Nan · ● · ● · Som-O · Pang
Row 2: Bank · Yot · Beam JR · ● · Yada · Sai · ● · Chanika · Apinya · Mix
```
`null` = black separator dot, `'_'` = empty desk placeholder. Names matched case-insensitively (spaces stripped) against `member.name`.

---

## Admin Draft/Publish mode (shipped 2026-06-25)
Admin writes for **all four entities** (members, pairs, holidays, overrides) now stage into a `draft_changes` table instead of writing the live tables directly, and only take effect on the public Viewer after an explicit **Publish**.
- Migration: `team-attendance/supabase/draft_changes_migration.sql` — table `draft_changes(table_name, row_key, action, payload jsonb)`, admin-only RLS (no public read), added to `supabase_realtime`. **Confirmed applied to the production Supabase project on 2026-06-25** (table, policies, and realtime publication all verified present). The migration file is idempotent (safe to re-run) for any future environment.
- `row_key` is the row `id` for members/pairs/holidays, or `${member_id}|${date}` for `attendance_overrides`.
- New hook `src/hooks/useDrafts.js`: `stage(tableName, rowKey, action, payload)`, `publish()` (client-side sequential apply across tables, stops and toasts on first error, only clears successfully-applied drafts), `discardAll()`, `pendingCount`.
- `useMembers`/`usePairs`/`useHolidays`/`useOverrides` now accept `{ includeDrafts, drafts }` — when omitted (as in `ViewerPage.jsx`), behavior is byte-for-byte the old live-table-only behavior. `AdminPage.jsx` passes `includeDrafts: true` and a shared `useDrafts()` instance to all four, so admin always sees live+draft merged data (merge helper: `src/lib/draftMerge.js` for id-keyed tables; override merge is inline in `useOverrides.js` since it's keyed by `member_id+date`).
- Merged rows the admin is currently viewing carry `_draft: 'insert' | 'update'` so UI can show a pending-publish indicator (amber dot in `MemberList.jsx`/`PairList.jsx`/`HolidayList.jsx`; "Draft — not yet published" label in `OverridePanel.jsx`). Not yet added to `FloorView.jsx` desk chips.
- `AdminPage.jsx` topbar: amber "N pending changes" pill, **Publish** button (confirm dialog → `drafts.publish()`), **Discard draft** button (confirm dialog → `drafts.discardAll()`), next to the existing Refresh button.
- Publish is **not** a single DB transaction — it applies staged changes one-by-one via the existing Supabase client, then deletes only the successfully-applied `draft_changes` rows. Accepted tradeoff for a 16-person internal tool; if a publish fails partway, remaining drafts stay staged (nothing already published is lost, but check toasts for which row failed).

## Done — current state
- [x] Viewer opens `/` and sees current week floor + calendar (Month/Week/Floor toggle)
- [x] StatsBar shows correct headcount per day
- [x] `/admin` is public, no login (removed 2026-06-25 — see Auth section)
- [x] Admin can add/edit/delete members with day checkboxes (converted to MW/MT/WT on save)
- [x] Admin can create/edit/delete pairs with color picker
- [x] Changes reflect across optimistic local state immediately; cross-device sync depends on Supabase realtime publication being enabled
- [x] Admin can click any member on floor view to set override (WFO/WFH/Leave + note)
- [x] Admin can reset override to revert to scheduled status (slide-in panel, "↺ Reset to schedule")
- [x] Weekly overview table shows Mon-Fri counts (in/WFH/leave), click-to-drill-down
- [x] Viewer floor view + week calendar reflect overrides (leave in amber, WFH in gray)
- [x] Admin can click an empty desk to add a new member pre-assigned to that slot
- [x] Manual "↻ Refresh" button on admin page
- [x] Deployed to Vercel: https://invteamv2.vercel.app
- [x] Thai public holidays (2026–2028 fixed-date) seeded in a `holidays` table; Admin → Holidays tab toggles whether the company observes each one; observed holidays show as a distinct "holiday" status across all admin/viewer views, overridable per member
- [x] Admin Schedule tab has a Floor/Week/Month toggle for rechecking the schedule before Publish (Floor/Week added 2026-06-25, Month added 2026-07-01)
- [x] Month calendar shows Mon–Fri only (Sat/Sun removed), all 16 members per day in fixed 2-row seat layout with status-colored initials chips (2026-07-01)
- [x] Wednesday rotation: 4-group rotating WFH system effective 2026-07-08; implemented as attendance_overrides (16 rows/Wednesday, overrides entire 4-week cycle for Wednesday); migration in `supabase/wednesday_rotation_migration.sql` (2026-07-01)
