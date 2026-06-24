import { err } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

export async function getApiProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as Profile | null
}

export async function requireProfile() {
  const profile = await getApiProfile()
  if (!profile) return { profile: null, error: err('Não autenticado', 401) as NextResponse }
  return { profile, error: null }
}

export async function requireGestor() {
  const { profile, error } = await requireProfile()
  if (error) return { profile: null, error }
  if (profile!.role !== 'gestor') return { profile: null, error: err('Acesso restrito ao gestor', 403) as NextResponse }
  return { profile, error: null }
}

export function filterOrdersByRole<T extends { supplier_id?: string; client_id?: string }>(
  rows: T[],
  role: UserRole,
  profile: Profile,
): T[] {
  if (role === 'gestor') return rows
  if (role === 'fornecedor' && profile.supplier_id) {
    return rows.filter(r => r.supplier_id === profile.supplier_id)
  }
  if (role === 'cliente' && profile.client_id) {
    return rows.filter(r => r.client_id === profile.client_id)
  }
  return []
}

export function filterProjectsByRole<T extends { client_id?: string | null }>(
  rows: T[],
  role: UserRole,
  profile: Profile,
): T[] {
  if (role === 'gestor') return rows
  if (role === 'cliente' && profile.client_id) {
    return rows.filter(r => r.client_id === profile.client_id)
  }
  return []
}
