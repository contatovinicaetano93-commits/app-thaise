import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

const qcpsSchema = z.object({
  score_q: z.coerce.number().min(0).max(10).default(5),
  score_c: z.coerce.number().min(0).max(10).default(5),
  score_p: z.coerce.number().min(0).max(10).default(5),
  score_s: z.coerce.number().min(0).max(10).default(5),
})

const schema = z.object({
  name: z.string().min(2),
  client_id: z.string().uuid().optional().nullable().transform(v => v || null),
  location: z.string().optional().nullable().transform(v => v || null),
  description: z.string().optional().nullable().transform(v => v || null),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  notes: z.string().optional().nullable().transform(v => v || null),
}).merge(qcpsSchema)

export async function GET(req: NextRequest) {
  try {
    const db = createServerClient()
    const search = req.nextUrl.searchParams.get('search')

    let query = db
      .from('projects')
      .select('*, client:clients(*)')
      .order('updated_at', { ascending: false })

    if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`)

    const { data, error } = await query
    if (error) return err(error.message, 500)
    return ok(data, { total: data.length })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)
    const db = createServerClient()

    const { data, error } = await db
      .from('projects')
      .insert({ ...payload, phase: 'A' } as never)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
