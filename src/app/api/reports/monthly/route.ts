import { ok, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { createSupabaseServer } from '@/lib/supabase/server'
import { qcpsAverage } from '@/lib/qcps'

interface MonthlyMetrics {
  orders: number
  revenue: number
  activeSuppliers: number
  avgQcps: number
  activeProjects: number
  insights: number
  delivered: number
  pending: number
}

function buildDeterministicSummary(periodLabel: string, m: MonthlyMetrics): string {
  return [
    `Relatório ${periodLabel}`,
    `${m.orders} pedido(s) no mês · receita entregue ${m.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    `${m.activeSuppliers} fornecedor(es) ativo(s) · QCPS médio ${m.avgQcps}/10`,
    `${m.activeProjects} empreendimento(s) ativo(s)`,
    `${m.insights} insight(s) AI gerados no mês`,
  ].join(' · ')
}

async function generateMonthlySummary(periodLabel: string, metrics: MonthlyMetrics): Promise<string> {
  const fallback = buildDeterministicSummary(periodLabel, metrics)
  const ai = await chatCompletion([
    {
      role: 'system',
      content:
        'Você é analista do Hub Estlar (curadoria de ativos, empreendimentos e consolidação patrimonial). ' +
        'Escreva um parágrafo executivo em português (3–4 frases), objetivo e acionável para a gestora.',
    },
    {
      role: 'user',
      content: JSON.stringify({ periodo: periodLabel, metricas: metrics }),
    },
  ], { maxTokens: 280, temperature: 0.4 })
  return ai || fallback
}

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const periodLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    const [ordersRes, suppliersRes, projectsRes, insightsRes] = await Promise.all([
      db.from('orders').select('id, status, total_price, created_at').gte('created_at', monthStart),
      db.from('suppliers').select('id, name, status, score_q, score_c, score_p, score_s'),
      db.from('projects').select('id, phase, status'),
      db.from('agent_insights').select('id').gte('created_at', monthStart),
    ])

    const orders = ordersRes.data ?? []
    const suppliers = suppliersRes.data ?? []
    const projects = projectsRes.data ?? []

    const delivered = orders.filter((o: { status: string }) => o.status === 'delivered')
    const revenue = delivered.reduce((acc: number, o: { total_price: number }) => acc + Number(o.total_price), 0)
    const pending = orders.filter((o: { status: string }) => o.status === 'pending' || o.status === 'approved').length

    const activeSuppliers = suppliers.filter((s: { status: string }) => s.status === 'active')
    const avgQcps = activeSuppliers.length
      ? Math.round(activeSuppliers.reduce((acc: number, s: { score_q: number; score_c: number; score_p: number; score_s: number }) =>
          acc + qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number }), 0) / activeSuppliers.length * 10) / 10
      : 0

    const metrics = {
      orders: orders.length,
      revenue,
      activeSuppliers: activeSuppliers.length,
      avgQcps,
      activeProjects: projects.filter((p: { status: string }) => p.status === 'active').length,
      insights: insightsRes.data?.length ?? 0,
      delivered: delivered.length,
      pending,
    }

    const summary = await generateMonthlySummary(periodLabel, metrics)

    return ok({
      period: { from: monthStart, to: now.toISOString() },
      periodLabel,
      metrics,
      summary,
      aiPowered: isLlmConfigured(),
    })
  } catch (e) {
    return handleError(e)
  }
}
