import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export async function usuarioActual() {
  const sb = await supabaseServer()
  const { data } = await sb.auth.getUser()
  if (!data.user) redirect('/login')
  const { data: admin } = await sb.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return { sb, user: data.user, esAdmin: !!admin }
}
