import { ok, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const db = createServerClient()
    const { data, error } = await db
      .from('agent_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return ok([])
    return ok(data ?? [], { total: data?.length ?? 0 })
  } catch (e) {
    return handleError(e)
  }
}
