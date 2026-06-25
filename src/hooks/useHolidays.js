import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { mergeDrafts } from '../lib/draftMerge'

export function useHolidays({ includeDrafts = false, drafts } = {}) {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const liveRef = useRef([])
  const seqRef = useRef(0)

  useEffect(() => {
    fetchHolidays()

    const channel = supabase
      .channel('holidays')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, fetchHolidays)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (includeDrafts) setHolidays(sortByDate(mergeDrafts(liveRef.current, drafts?.draftsFor('holidays') || [])))
  }, [includeDrafts, drafts?.drafts])

  function sortByDate(rows) {
    return [...rows].sort((a, b) => a.date.localeCompare(b.date))
  }

  async function fetchHolidays() {
    const mySeq = ++seqRef.current
    const { data, error } = await supabase.from('holidays').select('*').order('date', { ascending: true })
    if (mySeq !== seqRef.current) return
    if (error) { toast(error.message); setLoading(false); return }
    liveRef.current = data || []
    setHolidays(includeDrafts ? sortByDate(mergeDrafts(liveRef.current, drafts?.draftsFor('holidays') || [])) : liveRef.current)
    setLoading(false)
  }

  async function addHoliday(holiday) {
    if (includeDrafts) {
      const id = crypto.randomUUID()
      return drafts.stage('holidays', id, 'insert', holiday)
    }
    setHolidays(prev => sortByDate([...prev, holiday]))
    const { error } = await supabase.from('holidays').insert(holiday)
    if (error) { toast(error.message) }
    fetchHolidays()
    return error
  }

  async function updateHoliday(id, updates) {
    if (includeDrafts) return drafts.stage('holidays', id, 'update', updates)
    setHolidays(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)))
    const { error } = await supabase.from('holidays').update(updates).eq('id', id)
    if (error) { toast(error.message); fetchHolidays() }
    return error
  }

  async function toggleObserved(id, isObserved) {
    return updateHoliday(id, { is_observed: isObserved })
  }

  async function deleteHoliday(id) {
    if (includeDrafts) return drafts.stage('holidays', id, 'delete')
    setHolidays(prev => prev.filter(h => h.id !== id))
    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (error) { toast(error.message); fetchHolidays() }
    return error
  }

  return { holidays, loading, addHoliday, updateHoliday, toggleObserved, deleteHoliday, refresh: fetchHolidays }
}
