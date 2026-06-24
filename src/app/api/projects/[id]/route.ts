import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  client_id: z.string().uuid().optional().nullable().transform(v => v || null),
  location: z.string().optional().nullable().transform(v => v || null),
  description: z.string().optional().nullable().transform(v => v || null),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable().transform(v => v || null),
  score_q: z.coerce.number().min(0).max(10).optional(),
  score_c: z.coerce.number().min(0).max(10).optional(),
  score_p: z.coerce.number().min(0).max(10).optional(),
  score_s: z.coerce.number().min(0).max(10).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('projects')
      .update(payload as never)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Empreendimento não encontrado', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServerClient()

    const { error } = await db.from('projects').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
