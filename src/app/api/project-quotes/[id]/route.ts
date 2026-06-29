import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireProfile, requireGestor } from '@/lib/auth/api-context'
import { QUOTE_SELECT } from '@/lib/quotes/server'

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['cancelled']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const db = await createSupabaseServer()

    const { data, error } = await db.from('project_quotes').select(QUOTE_SELECT).eq('id', id).single()
    if (error || !data) return err('Orçamento não encontrado', 404)

    const quote = data as { client_id: string; status: string }
    if (profile!.role === 'cliente') {
      if (profile!.client_id !== quote.client_id) return err('Acesso negado', 403)
      if (!['sent', 'approved', 'rejected'].includes(quote.status)) return err('Orçamento não disponível', 403)
    } else if (profile!.role !== 'gestor') {
      return err('Acesso negado', 403)
    }

    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const payload = patchSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { data: existing } = await db.from('project_quotes').select('status').eq('id', id).single() as {
      data: { status: string } | null
    }
    if (!existing) return err('Orçamento não encontrado', 404)
    if (existing.status !== 'draft' && payload.status !== 'cancelled') {
      return err('Só é possível editar rascunhos', 422)
    }
    if (payload.status === 'cancelled' && !['draft', 'sent'].includes(existing.status)) {
      return err('Não é possível cancelar este orçamento', 422)
    }

    const { data, error } = await db
      .from('project_quotes')
      .update(payload as never)
      .eq('id', id)
      .select(QUOTE_SELECT)
      .single()

    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
