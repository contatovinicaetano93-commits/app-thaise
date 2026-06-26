import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { generateAmendmentContent } from '@/lib/estlar/proposal'

const createSchema = z.object({
  description: z.string().min(10),
  amount: z.coerce.number().nonnegative(),
  days_added: z.coerce.number().int().nonnegative().default(0),
})

const patchSchema = z.object({
  amendment_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('scope_amendments')
      .select('*')
      .eq('project_id', id)
      .order('number', { ascending: true })
    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const body = createSchema.parse(await req.json())
    const db = await createSupabaseServer()

    const { count } = await db
      .from('scope_amendments')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)

    const number = (count ?? 0) + 1

    const { data: project } = await db
      .from('projects')
      .select('name, clients(name)')
      .eq('id', id)
      .single()

    const proj = project as { name: string; clients?: { name?: string } } | null
    const content = generateAmendmentContent({
      projectName: proj?.name ?? 'Projeto',
      clientName: proj?.clients?.name ?? 'Cliente',
      number,
      description: body.description,
      amount: body.amount,
      daysAdded: body.days_added,
    })

    const { data, error } = await db
      .from('scope_amendments')
      .insert({
        project_id: id,
        number,
        description: `${body.description}\n\n---\n${content}`,
        amount: body.amount,
        days_added: body.days_added,
        status: 'draft',
      } as never)
      .select()
      .single()

    if (error) return err(error.message, 500)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const body = patchSchema.parse(await req.json())
    const db = await createSupabaseServer()
    const now = new Date().toISOString()

    const { data, error } = await db
      .from('scope_amendments')
      .update({ status: body.status, approved_at: body.status === 'approved' ? now : null } as never)
      .eq('id', body.amendment_id)
      .eq('project_id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
