import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional().transform(v => v || null),
  segment: z.string().optional().transform(v => v || null),
  notes: z.string().optional().transform(v => v || null),
})

export async function GET(req: NextRequest) {
  try {
    const db = createServerClient()
    const search = req.nextUrl.searchParams.get('search')

    let query = db.from('clients').select('*').order('name')
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)

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
      .from('clients')
      .insert(payload as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return err('Este email já está cadastrado', 409)
      return err(error.message, 500)
    }
    return ok(data, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
