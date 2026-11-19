import { supabase } from '@/lib/supabase.js'

export async function listTeam() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, approved, created_at')
    .order('full_name')
  if (error) throw error
  return data
}

export async function updateMember(id, { role, approved }) {
  const { data, error } = await supabase.rpc('admin_update_profile', { p_id: id, p_role: role, p_approved: approved })
  if (error) throw new Error(error.message)
  return data
}
