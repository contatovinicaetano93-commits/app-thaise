import { createServiceClient } from '@/lib/supabase-server'

export async function recalcQuoteTotal(quoteId: string) {
  const db = createServiceClient()
  const { data: lines } = await db
    .from('project_quote_lines')
    .select('line_total')
    .eq('quote_id', quoteId)

  const total = (lines ?? []).reduce((sum, l) => sum + Number((l as { line_total: number }).line_total), 0)
  await db.from('project_quotes').update({ total_price: total } as never).eq('id', quoteId)
  return total
}

export async function nextQuoteVersion(projectId: string): Promise<number> {
  const db = createServiceClient()
  const { data } = await db
    .from('project_quotes')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { version: number } | null }

  return (data?.version ?? 0) + 1
}

export const QUOTE_SELECT = `
  *,
  project:projects(id,name,client_id),
  client:clients(id,name),
  lines:project_quote_lines(
    *,
    product:products(id,name,unit,category),
    supplier:suppliers(id,name)
  )
`
