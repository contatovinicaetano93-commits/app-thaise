import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireProfile } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().transform(v => v || null),
  category: z.string().min(2).optional(),
  price: z.number().min(0.01).optional(),
  unit: z.string().min(1).optional(),
  min_order: z.number().int().min(1).optional(),
  lead_time_days: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data: existing } = await db.from('products').select('supplier_id, name').eq('id', id).single() as {
      data: { supplier_id: string; name: string } | null
    }
    if (!existing) return err('Produto não encontrado', 404)
    if (profile!.role === 'fornecedor' && profile!.supplier_id !== existing.supplier_id) {
      return err('Fornecedor só pode editar produtos próprios', 403)
    }
    if (profile!.role === 'cliente') return err('Acesso negado', 403)

    const { data, error } = await db
      .from('products')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Produto não encontrado', 404)

    const product = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'product',
      entityId: product.id,
      eventType: 'product.updated',
      title: 'Produto atualizado',
      detail: product.name,
      actorId: profile!.id,
      cachePrefix: 'products',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode excluir produtos', 403)

    const { id } = await params
    const db = createServerClient()

    const { data: existing } = await db.from('products').select('name').eq('id', id).single() as {
      data: { name: string } | null
    }

    const { error } = await db.from('products').delete().eq('id', id)
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'product',
      entityId: id,
      eventType: 'product.deleted',
      title: 'Produto removido',
      detail: existing?.name,
      actorId: profile!.id,
      cachePrefix: 'products',
    })

    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
