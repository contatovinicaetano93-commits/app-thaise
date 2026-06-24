import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cliente anon — Route Handlers sem sessão do usuário
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Supabase não configurado. Preencha o .env.local')

  return createClient<Database>(url, key)
}

// Service role — workers e jobs em background
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Supabase não configurado')

  return createClient<Database>(url, key)
}
