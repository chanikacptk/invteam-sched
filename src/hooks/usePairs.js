import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { mergeDrafts } from '../lib/draftMerge'

export function usePairs({ includeDrafts = false, drafts } = {}) {
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const liveRef = useRef([])
  const seqRef = useRef(0)

  useEffect(() => {
    fetchPairs()

    const channel = supabase
      .channel('pairs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pairs' }, fetchPairs)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (includeDrafts) setPairs(mergeDrafts(liveRef.current, drafts?.draftsFor('pairs') || []))
  }, [includeDrafts, drafts?.drafts])

  async function fetchPairs() {
    const mySeq = ++seqRef.current
    const { data, error } = await supabase.from('pairs').select('*').order('name')
    if (mySeq !== seqRef.current) return
    if (error) { toast(error.message); setLoading(false); return }
    liveRef.current = data || []
    setPairs(includeDrafts ? mergeDrafts(liveRef.current, drafts?.draftsFor('pairs') || []) : liveRef.current)
    setLoading(false)
  }

  async function addPair(pair) {
    if (includeDrafts) {
      const id = crypto.randomUUID()
      return drafts.stage('pairs', id, 'insert', pair)
    }
    const { error } = await supabase.from('pairs').insert([pair])
    if (error) toast(error.message)
    return error
  }

  async function updatePair(id, updates) {
    if (includeDrafts) return drafts.stage('pairs', id, 'update', updates)
    const { error } = await supabase.from('pairs').update(updates).eq('id', id)
    if (error) toast(error.message)
    return error
  }

  async function deletePair(id) {
    if (includeDrafts) return drafts.stage('pairs', id, 'delete')
    const { error } = await supabase.from('pairs').delete().eq('id', id)
    if (error) toast(error.message)
    return error
  }

  return { pairs, loading, addPair, updatePair, deletePair, refresh: fetchPairs }
}
