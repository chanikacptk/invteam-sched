import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()

    const channel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchMembers)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchMembers() {
    const { data, error } = await supabase.from('members').select('*').order('name')
    if (error) { toast(error.message); } else { setMembers(data || []) }
    setLoading(false)
  }

  async function addMember(member) {
    const { error } = await supabase.from('members').insert([member])
    if (error) toast(error.message)
    return error
  }

  async function updateMember(id, updates) {
    const { error } = await supabase.from('members').update(updates).eq('id', id)
    if (error) toast(error.message)
    return error
  }

  async function deleteMember(id) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) toast(error.message)
    return error
  }

  return { members, loading, addMember, updateMember, deleteMember }
}
