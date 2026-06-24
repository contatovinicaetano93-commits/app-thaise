import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseAnonKey, getSupabaseUrl, requireSupabaseConfig } from '@/lib/supabase/env'

// Usado apenas nos Route Handlers (server-side) — nunca no client
export function createServerClient() {
  const { url, key } = requireSupabaseConfig()
  return createClient<Database>(url, key)
}

// Service role — workers e jobs em background
export function createServiceClient() {
  const url = getSupabaseUrl()
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    getSupabaseAnonKey()

  if (!url || !key) throw new Error('Supabase não configurado')

  return createClient<Database>(url, key)
}
