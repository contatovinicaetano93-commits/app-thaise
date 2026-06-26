import { err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('products')
      .select('id, name, category, price, unit, active, lead_time_days, created_at, supplier:suppliers(name)')
      .order('name')

    if (error) return err(error.message, 500)

    const header = 'id,nome,categoria,preco,unidade,ativo,prazo_dias,fornecedor,criado_em'
    const rows = (data ?? []).map((p: {
      id: string; name: string; category: string; price: number; unit: string
      active: boolean; lead_time_days?: number | null; created_at: string
      supplier?: { name: string }
    }) => [
      p.id, p.name, p.category, p.price, p.unit, p.active ? 'sim' : 'nao',
      p.lead_time_days ?? '', p.supplier?.name ?? '', p.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [header, ...rows].join('\n')
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="produtos-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
