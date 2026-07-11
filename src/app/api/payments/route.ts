import { NextRequest } from 'next/server'
import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { PAYMENT_SELECT } from '@/lib/payments/server'

export async function GET(req: NextRequest) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const status = req.nextUrl.searchParams.get('status')

    let query = db
      .from('order_payments')
      .select(PAYMENT_SELECT)
      .order('held_at', { ascending: false })
      .limit(50)

    if (profile!.role === 'fornecedor') {
      if (!profile!.supplier_id) return ok([])
      query = query.eq('supplier_id', profile!.supplier_id)
    } else if (profile!.role !== 'gestor') {
      return err('Acesso negado', 403)
    }

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}
