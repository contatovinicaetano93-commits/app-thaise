import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/lib/auth/roles'

export type PortalAccessStatus =
  | { allowed: true }
  | { allowed: false; reason: string }

export async function checkPortalAccess(
  db: SupabaseClient,
  profile: Pick<Profile, 'role' | 'supplier_id' | 'client_id'>,
): Promise<PortalAccessStatus> {
  if (profile.role === 'gestor') return { allowed: true }

  if (profile.role === 'fornecedor') {
    if (!profile.supplier_id) {
      return { allowed: false, reason: 'Conta sem fornecedor vinculado. Aguarde o convite da Estlar.' }
    }
    const { data: supplier } = await db
      .from('suppliers')
      .select('status, name')
      .eq('id', profile.supplier_id)
      .single() as { data: { status: string; name: string } | null }

    if (!supplier) {
      return { allowed: false, reason: 'Fornecedor não encontrado. Peça um novo convite à Estlar.' }
    }
    if (supplier.status !== 'active') {
      return {
        allowed: false,
        reason: supplier.status === 'pending'
          ? 'Fornecedor aguardando homologação pela Estlar.'
          : 'Fornecedor inativo. Entre em contato com a Estlar.',
      }
    }
    return { allowed: true }
  }

  if (profile.role === 'cliente') {
    if (!profile.client_id) {
      return { allowed: false, reason: 'Conta sem cliente vinculado. Aguarde o convite da Estlar.' }
    }
    const { count } = await db
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', profile.client_id)
      .eq('portal_enabled', true)
      .eq('status', 'active')

    if (!count) {
      return {
        allowed: false,
        reason: 'Sua obra ainda não foi liberada no portal. A Estlar avisará quando estiver pronta.',
      }
    }
    return { allowed: true }
  }

  return { allowed: false, reason: 'Perfil sem acesso ao portal.' }
}

export const PORTAL_GATE_PATH = '/acesso-pendente'

export function isPortalGateExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/auth/') ||
    pathname === PORTAL_GATE_PATH ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/')
  )
}

export function roleNeedsPortalGate(role: UserRole): boolean {
  return role === 'fornecedor' || role === 'cliente'
}
