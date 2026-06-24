/** Chave pública — suporta formato novo (publishable) e legado (anon JWT) */
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function requireSupabaseConfig() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local',
    )
  }
  return { url, key }
}
