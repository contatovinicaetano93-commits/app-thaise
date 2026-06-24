import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  contact_name: z.string().min(2).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().min(8).optional(),
  website: z.string().url().optional().or(z.literal('')).transform(v => v || null),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  notes: z.string().optional().transform(v => v || null),
  score_q: z.coerce.number().min(0).max(10).optional(),
  score_c: z.coerce.number().min(0).max(10).optional(),
  score_p: z.coerce.number().min(0).max(10).optional(),
  score_s: z.coerce.number().min(0).max(10).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('suppliers')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Fornecedor não encontrado', 404)

    const supplier = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'supplier',
      entityId: supplier.id,
      eventType: 'supplier.updated',
      title: 'Fornecedor atualizado',
      detail: supplier.name,
      actorId: profile!.id,
      cachePrefix: 'suppliers',
    })

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const db = createServerClient()

    const { data: existing } = await db.from('suppliers').select('name').eq('id', id).single() as {
      data: { name: string } | null
    }

    const { error } = await db.from('suppliers').delete().eq('id', id)
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'supplier',
      entityId: id,
      eventType: 'supplier.deleted',
      title: 'Fornecedor removido',
      detail: existing?.name,
      actorId: profile!.id,
      cachePrefix: 'suppliers',
    })

    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
