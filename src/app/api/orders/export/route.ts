import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = createServerClient()
    const { data, error } = await db
      .from('orders')
      .select('id, status, quantity, unit_price, total_price, created_at, client:clients(name), supplier:suppliers(name), product:products(name), project:projects(name)')
      .order('created_at', { ascending: false })

    if (error) return err(error.message, 500)

    const header = 'id,cliente,fornecedor,produto,empreendimento,quantidade,preco_unitario,total,status,data'
    const rows = (data ?? []).map((o: {
      id: string; status: string; quantity: number; unit_price: number; total_price: number; created_at: string
      client?: { name: string }; supplier?: { name: string }; product?: { name: string }; project?: { name: string }
    }) => [
      o.id,
      o.client?.name ?? '',
      o.supplier?.name ?? '',
      o.product?.name ?? '',
      o.project?.name ?? '',
      o.quantity,
      o.unit_price,
      o.total_price,
      o.status,
      o.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [header, ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
