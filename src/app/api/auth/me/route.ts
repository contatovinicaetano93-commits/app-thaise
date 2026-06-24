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

    return ok({ user: { id: user.id, email: user.email }, profile })
  } catch (e) {
    return handleError(e)
  }
}
