import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) throw new Error('Supabase não configurado')

  return createBrowserClient<Database>(url, key)
}
