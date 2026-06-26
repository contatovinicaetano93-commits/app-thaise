import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseUrl, requireSupabaseConfig } from '@/lib/supabase/env'

// Service role — workers, intake, cron, audit writes (NUNCA fallback para anon)
export function createServiceClient() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada — obrigatória para workers, intake e agents',
    )
  }

  return createClient<Database>(url, key)
}

/** @deprecated Use createSupabaseServer() para rotas com sessão ou createServiceClient() para sistema */
export function createServerClient() {
  const { url, key } = requireSupabaseConfig()
  return createClient<Database>(url, key)
}
