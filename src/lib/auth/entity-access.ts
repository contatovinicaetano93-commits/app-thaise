import { err } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/roles'
import type { EntityType } from '@/lib/memory/events'
import { NextResponse } from 'next/server'

/** Verifica se o perfil pode acessar a entidade (RLS + regras de negócio). */
export async function assertEntityAccess(
  profile: Profile,
  entityType: EntityType,
  entityId: string,
): Promise<NextResponse | null> {
  if (profile.role === 'gestor') return null

  const db = await createSupabaseServer()

  switch (entityType) {
    case 'order': {
      const { data } = await db.from('orders').select('id, supplier_id, client_id').eq('id', entityId).single() as {
        data: { id: string; supplier_id: string; client_id: string } | null
      }
      if (!data) return err('Pedido não encontrado', 404)
      if (profile.role === 'fornecedor' && data.supplier_id !== profile.supplier_id) {
        return err('Acesso negado', 403)
      }
      if (profile.role === 'cliente' && data.client_id !== profile.client_id) {
        return err('Acesso negado', 403)
      }
      return null
    }
    case 'project': {
      const { data } = await db.from('projects').select('id, client_id').eq('id', entityId).single() as {
        data: { id: string; client_id: string | null } | null
      }
      if (!data) return err('Empreendimento não encontrado', 404)
      if (profile.role === 'cliente' && data.client_id !== profile.client_id) {
        return err('Acesso negado', 403)
      }
      if (profile.role === 'fornecedor') return err('Acesso negado', 403)
      return null
    }
    case 'supplier': {
      if (profile.role !== 'fornecedor' || profile.supplier_id !== entityId) {
        return err('Acesso negado', 403)
      }
      return null
    }
    case 'client': {
      if (profile.role !== 'cliente' || profile.client_id !== entityId) {
        return err('Acesso negado', 403)
      }
      return null
    }
    case 'product':
    case 'opportunity':
      return err('Acesso negado', 403)
    default:
      return err('Acesso negado', 403)
  }
}
