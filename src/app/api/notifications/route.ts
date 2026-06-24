import { ok, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ok([])

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ok(null)

    const { id, readAll } = await req.json() as { id?: string; readAll?: boolean }

    if (readAll) {
      await supabase.from('notifications').update({ read: true } as never).eq('user_id', user.id)
    } else if (id) {
      await supabase.from('notifications').update({ read: true } as never).eq('id', id).eq('user_id', user.id)
    }

    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}
