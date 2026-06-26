import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { computeQuotationQcps } from '@/lib/qcps'

const createSchema = z.object({
  description: z.string().min(3),
  amount: z.coerce.number().positive(),
  supplier_id: z.string().uuid().optional().nullable(),
  score_q: z.coerce.number().min(0).max(10).default(5),
  score_c: z.coerce.number().min(0).max(10).default(5),
  score_p: z.coerce.number().min(0).max(10).default(5),
  score_s: z.coerce.number().min(0).max(10).default(5),
})

const selectSchema = z.object({
  quotation_id: z.string().uuid(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('quotations')
      .select('*, suppliers(name, homologation_tier)')
      .eq('project_id', id)
      .order('qcps_total', { ascending: false })
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
    const scores = { score_q: body.score_q, score_c: body.score_c, score_p: body.score_p, score_s: body.score_s }
    const qcps_total = computeQuotationQcps(scores)

    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('quotations')
      .insert({
        project_id: id,
        supplier_id: body.supplier_id ?? null,
        description: body.description,
        amount: body.amount,
        ...scores,
        qcps_total,
        selected: false,
      } as never)
      .select('*, suppliers(name, homologation_tier)')
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
    const body = selectSchema.parse(await req.json())
    const db = await createSupabaseServer()

    await db.from('quotations').update({ selected: false } as never).eq('project_id', id)
    const { data, error } = await db
      .from('quotations')
      .update({ selected: true } as never)
      .eq('id', body.quotation_id)
      .eq('project_id', id)
      .select('*, suppliers(name, homologation_tier)')
      .single()

    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
