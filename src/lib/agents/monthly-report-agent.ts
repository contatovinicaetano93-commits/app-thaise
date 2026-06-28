import { chatCompletion } from '@/lib/llm'

export interface MonthlyMetrics {
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

export async function generateMonthlySummary(periodLabel: string, metrics: MonthlyMetrics): Promise<string> {
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
