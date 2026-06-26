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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é analista da Plataforma Thaise (gestão de fornecedores, empreendimentos e pedidos). ' +
              'Escreva um parágrafo executivo em português (3–4 frases), objetivo e acionável para a gestora.',
          },
          {
            role: 'user',
            content: JSON.stringify({ periodo: periodLabel, metricas: metrics }),
          },
        ],
        max_tokens: 280,
        temperature: 0.4,
      }),
    })

    if (!res.ok) return fallback
    const json = await res.json()
    const ai = json.choices?.[0]?.message?.content?.trim()
    return ai || fallback
  } catch {
    return fallback
  }
}
