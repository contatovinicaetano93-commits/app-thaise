import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return err('Não autenticado', 401)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) return err(error.message, 500)

    let supplier: { id: string; name: string; status: string } | null = null
    const supplierId = (profile as { supplier_id?: string | null } | null)?.supplier_id
    if (supplierId) {
      const { data: row } = await supabase
        .from('suppliers')
        .select('id, name, status')
        .eq('id', supplierId)
        .maybeSingle()
      if (row) supplier = row as { id: string; name: string; status: string }
    }

    return ok({ user: { id: user.id, email: user.email }, profile, supplier })
  } catch (e) {
    return handleError(e)
  }
}
