import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { auditAndInvalidate } from '@/lib/memory/audit'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  company: z.string().optional().transform(v => v || null),
  segment: z.string().optional().transform(v => v || null),
  notes: z.string().optional().transform(v => v || null),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = await createSupabaseServer()

    const { data, error } = await db
      .from('clients')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Cliente não encontrado', 404)

    const client = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'client',
      entityId: client.id,
      eventType: 'client.updated',
      title: 'Cliente atualizado',
      detail: client.name,
      actorId: profile!.id,
      cachePrefix: 'clients',
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
    const db = await createSupabaseServer()

    const { data: existing } = await db.from('clients').select('name').eq('id', id).single() as {
      data: { name: string } | null
    }

    const { error } = await db.from('clients').delete().eq('id', id)
    if (error) return err(error.message, 500)

    await auditAndInvalidate({
      entityType: 'client',
      entityId: id,
      eventType: 'client.deleted',
      title: 'Cliente removido',
      detail: existing?.name,
      actorId: profile!.id,
      cachePrefix: 'clients',
    })

    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
