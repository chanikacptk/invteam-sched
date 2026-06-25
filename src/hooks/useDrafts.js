import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export function useDrafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const seqRef = useRef(0)

  useEffect(() => {
    fetchDrafts()

    const channel = supabase
      .channel('draft-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_changes' }, fetchDrafts)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchDrafts() {
    const mySeq = ++seqRef.current
    const { data, error } = await supabase.from('draft_changes').select('*')
    if (mySeq !== seqRef.current) return
    if (error) { toast(error.message) } else { setDrafts(data || []) }
    setLoading(false)
  }

  function draftsFor(tableName) {
    return drafts.filter(d => d.table_name === tableName)
  }

  async function stage(tableName, rowKey, action, payload = null) {
    setDrafts(prev => {
      const without = prev.filter(d => !(d.table_name === tableName && d.row_key === rowKey))
      return [...without, { table_name: tableName, row_key: rowKey, action, payload }]
    })

    const { error } = await supabase
      .from('draft_changes')
      .upsert({ table_name: tableName, row_key: rowKey, action, payload }, { onConflict: 'table_name,row_key' })

    if (error) { toast(error.message) }
    fetchDrafts()
    return error
  }

  function applyOne(draft) {
    const { table_name, row_key, action, payload } = draft
    if (table_name === 'attendance_overrides') {
      const [memberId, date] = row_key.split('|')
      if (action === 'delete') {
        return supabase.from('attendance_overrides').delete().eq('member_id', memberId).eq('date', date)
      }
      return supabase
        .from('attendance_overrides')
        .upsert({ member_id: memberId, date, ...payload }, { onConflict: 'member_id,date' })
    }

    if (action === 'insert') {
      return supabase.from(table_name).insert([{ id: row_key, ...payload }])
    }
    if (action === 'update') {
      return supabase.from(table_name).update(payload).eq('id', row_key)
    }
    return supabase.from(table_name).delete().eq('id', row_key)
  }

  async function publish() {
    const pending = [...drafts]
    const applied = []
    for (const draft of pending) {
      const { error } = await applyOne(draft)
      if (error) {
        toast(`Publish stopped: ${error.message}`)
        break
      }
      applied.push(draft)
    }

    if (applied.length) {
      const { error } = await supabase
        .from('draft_changes')
        .delete()
        .in('id', applied.map(d => d.id))
      if (error) toast(error.message)
    }

    fetchDrafts()
    return { published: applied.length, total: pending.length }
  }

  async function discardAll() {
    setDrafts([])
    const { error } = await supabase.from('draft_changes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { toast(error.message); fetchDrafts() }
    return error
  }

  return { drafts, loading, draftsFor, stage, publish, discardAll, refresh: fetchDrafts, pendingCount: drafts.length }
}
