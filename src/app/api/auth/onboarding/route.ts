import { ok, err, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const db = await createSupabaseServer()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return err('Não autenticado', 401)

    // Service role evita falha silenciosa de RLS no update do profile
    const admin = createServiceClient()
    const { error } = await admin
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() } as never)
      .eq('id', user.id)

    if (error) return err(error.message, 500)
    return ok({ completed: true })
  } catch (e) {
    return handleError(e)
  }
}
