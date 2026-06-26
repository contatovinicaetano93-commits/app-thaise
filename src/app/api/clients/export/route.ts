import { err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const { data, error } = await db.from('clients').select('*').order('name')
    if (error) return err(error.message, 500)

    const header = 'id,nome,email,telefone,empresa,segmento,criado_em'
    const rows = (data ?? []).map((c: {
      id: string; name: string; email: string; phone: string
      company?: string | null; segment?: string | null; created_at: string
    }) => [
      c.id, c.name, c.email, c.phone, c.company ?? '', c.segment ?? '', c.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [header, ...rows].join('\n')
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
