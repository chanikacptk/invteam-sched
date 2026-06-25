import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export function useOverrides(dateRange, { includeDrafts = false, drafts } = {}) {
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)
  const fromRef = useRef(dateRange?.from)
  const toRef = useRef(dateRange?.to)
  const liveRef = useRef([])
  const seqRef = useRef(0)

  const from = dateRange?.from
  const to = dateRange?.to

  useEffect(() => {
    if (!from || !to) return
    fromRef.current = from
    toRef.current = to
    fetchOverrides()

    const channel = supabase
      .channel(`overrides-${from}-${to}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_overrides' }, fetchOverrides)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [from, to])

  useEffect(() => {
    if (includeDrafts) setOverrides(mergeOverrideDrafts(liveRef.current, draftRows(), from, to))
  }, [includeDrafts, drafts?.drafts])

  function draftRows() {
    return drafts?.draftsFor('attendance_overrides') || []
  }

  function mergeOverrideDrafts(rows, draftList, rangeFrom, rangeTo) {
    const byKey = new Map(rows.map(r => [`${r.member_id}|${r.date}`, r]))
    for (const d of draftList) {
      const [memberId, date] = d.row_key.split('|')
      if (rangeFrom && rangeTo && (date < rangeFrom || date > rangeTo)) continue
      if (d.action === 'delete') {
        byKey.delete(d.row_key)
      } else {
        byKey.set(d.row_key, { member_id: memberId, date, ...d.payload, _draft: 'update' })
      }
    }
    return [...byKey.values()]
  }

  async function fetchOverrides() {
    const mySeq = ++seqRef.current
    const { data, error } = await supabase
      .from('attendance_overrides')
      .select('*')
      .gte('date', fromRef.current)
      .lte('date', toRef.current)
    if (mySeq !== seqRef.current) return
    if (error) { toast(error.message); setLoading(false); return }
    liveRef.current = data || []
    setOverrides(includeDrafts ? mergeOverrideDrafts(liveRef.current, draftRows(), fromRef.current, toRef.current) : liveRef.current)
    setLoading(false)
  }

  async function setOverride(memberId, date, status, note = '') {
    const rowKey = `${memberId}|${date}`

    if (includeDrafts) {
      return drafts.stage('attendance_overrides', rowKey, 'update', { status, note })
    }

    // Optimistic update immediately
    setOverrides(prev => {
      const without = prev.filter(o => !(o.member_id === memberId && o.date === date))
      return [...without, { member_id: memberId, date, status, note }]
    })

    const { error } = await supabase
      .from('attendance_overrides')
      .upsert({ member_id: memberId, date, status, note }, { onConflict: 'member_id,date' })

    if (error) {
      toast(error.message)
      fetchOverrides() // revert on error
    } else {
      fetchOverrides() // sync real id from server
    }
    return error
  }

  async function removeOverride(memberId, date) {
    const rowKey = `${memberId}|${date}`

    if (includeDrafts) {
      return drafts.stage('attendance_overrides', rowKey, 'delete')
    }

    // Optimistic remove immediately
    setOverrides(prev => prev.filter(o => !(o.member_id === memberId && o.date === date)))

    const { error } = await supabase
      .from('attendance_overrides')
      .delete()
      .eq('member_id', memberId)
      .eq('date', date)

    if (error) {
      toast(error.message)
      fetchOverrides() // revert on error
    }
    return error
  }

  return { overrides, loading, setOverride, removeOverride, refresh: fetchOverrides }
}
