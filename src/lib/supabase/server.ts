import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) throw new Error('Supabase não configurado')

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll from Server Component — middleware refreshes session
        }
      },
    },
  })
}

export async function getSessionProfile() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
