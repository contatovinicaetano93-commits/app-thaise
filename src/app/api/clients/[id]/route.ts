import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

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
    const { id } = await params
    const body = await req.json()
    const payload = updateSchema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('clients')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    if (!data) return err('Cliente não encontrado', 404)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServerClient()
    const { error } = await db.from('clients').delete().eq('id', id)
    if (error) return err(error.message, 500)
    return ok(null)
  } catch (e) {
    return handleError(e)
  }
}
