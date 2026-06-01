import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export function usePairs() {
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPairs()

    const channel = supabase
      .channel('pairs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairs' }, fetchPairs)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPairs() {
    const { data, error } = await supabase.from('pairs').select('*').order('name')
    if (error) { toast(error.message) } else { setPairs(data || []) }
    setLoading(false)
  }

  async function addPair(pair) {
    const { error } = await supabase.from('pairs').insert([pair])
    if (error) toast(error.message)
    return error
  }

  async function updatePair(id, updates) {
    const { error } = await supabase.from('pairs').update(updates).eq('id', id)
    if (error) toast(error.message)
    return error
  }

  async function deletePair(id) {
    const { error } = await supabase.from('pairs').delete().eq('id', id)
    if (error) toast(error.message)
    return error
  }

  return { pairs, loading, addPair, updatePair, deletePair }
}
