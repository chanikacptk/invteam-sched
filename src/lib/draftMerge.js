// Merges live rows (keyed by `id`) with pending draft_changes rows for that table.
// Used by useMembers/usePairs/useHolidays when `includeDrafts` is requested.
export function mergeDrafts(rows, drafts) {
  const byId = new Map(rows.map(r => [r.id, r]))

  for (const d of drafts) {
    if (d.action === 'delete') {
      byId.delete(d.row_key)
    } else if (d.action === 'update') {
      const existing = byId.get(d.row_key)
      if (existing) byId.set(d.row_key, { ...existing, ...d.payload, _draft: 'update' })
    } else if (d.action === 'insert') {
      byId.set(d.row_key, { id: d.row_key, ...d.payload, _draft: 'insert' })
    }
  }

  return [...byId.values()]
}
