import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Usado apenas nos Route Handlers (server-side) — nunca no client
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Supabase não configurado. Preencha o .env.local')

  return createClient<Database>(url, key)
}
