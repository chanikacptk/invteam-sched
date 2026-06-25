import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { mergeDrafts } from '../lib/draftMerge'

export function useMembers({ includeDrafts = false, drafts } = {}) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const liveRef = useRef([])
  const seqRef = useRef(0)

  useEffect(() => {
    fetchMembers()

    const channel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchMembers)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Re-merge whenever the draft set changes, without re-fetching the live table.
  useEffect(() => {
    if (includeDrafts) setMembers(mergeDrafts(liveRef.current, drafts?.draftsFor('members') || []))
  }, [includeDrafts, drafts?.drafts])

  async function fetchMembers() {
    const mySeq = ++seqRef.current
    const { data, error } = await supabase.from('members').select('*').order('name')
    if (mySeq !== seqRef.current) return
    if (error) { toast(error.message); setLoading(false); return }
    liveRef.current = data || []
    setMembers(includeDrafts ? mergeDrafts(liveRef.current, drafts?.draftsFor('members') || []) : liveRef.current)
    setLoading(false)
  }

  async function addMember(member) {
    if (includeDrafts) {
      const id = crypto.randomUUID()
      return drafts.stage('members', id, 'insert', member)
    }
    const { error } = await supabase.from('members').insert([member])
    if (error) toast(error.message)
    return error
  }

  async function updateMember(id, updates) {
    if (includeDrafts) return drafts.stage('members', id, 'update', updates)
    const { error } = await supabase.from('members').update(updates).eq('id', id)
    if (error) toast(error.message)
    return error
  }

  async function deleteMember(id) {
    if (includeDrafts) return drafts.stage('members', id, 'delete')
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) toast(error.message)
    return error
  }

  return { members, loading, addMember, updateMember, deleteMember, refresh: fetchMembers }
}
