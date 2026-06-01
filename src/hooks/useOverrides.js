import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export function useOverrides(dateRange) {
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  const from = dateRange?.from
  const to = dateRange?.to

  useEffect(() => {
    if (!from || !to) return
    fetchOverrides()

    const channel = supabase
      .channel(`overrides-${from}-${to}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_overrides' }, fetchOverrides)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [from, to])

  async function fetchOverrides() {
    const { data, error } = await supabase
      .from('attendance_overrides')
      .select('*')
      .gte('date', from)
      .lte('date', to)
    if (error) { toast(error.message) } else { setOverrides(data || []) }
    setLoading(false)
  }

  async function setOverride(memberId, date, status, note = '') {
    const { error } = await supabase
      .from('attendance_overrides')
      .upsert({ member_id: memberId, date, status, note }, { onConflict: 'member_id,date' })
    if (error) toast(error.message)
    return error
  }

  async function removeOverride(memberId, date) {
    const { error } = await supabase
      .from('attendance_overrides')
      .delete()
      .eq('member_id', memberId)
      .eq('date', date)
    if (error) toast(error.message)
    return error
  }

  return { overrides, loading, setOverride, removeOverride }
}
