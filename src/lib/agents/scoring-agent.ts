/**
 * Agente de Scoring QCPS
 * Regras determinísticas + insight opcional via OpenAI
 */

import { createServiceClient } from '@/lib/supabase-server'
import type { QcpsScores } from '@/lib/qcps'
import { qcpsAverage, homologationTierFromQcps } from '@/lib/qcps'

interface OrderRow {
  status: string
  total_price: number
  created_at: string
  updated_at: string
}

function clamp(n: number) {
  return Math.round(Math.min(10, Math.max(0, n)) * 10) / 10
}

function computeSupplierScores(orders: OrderRow[]): QcpsScores {
  if (orders.length === 0) {
    return { score_q: 5, score_c: 5, score_p: 5, score_s: 5 }
  }

  const delivered = orders.filter(o => o.status === 'delivered')
  const cancelled = orders.filter(o => o.status === 'cancelled')
  const deliveryRate = delivered.length / orders.length

  // Q — taxa de entrega sem cancelamento
  const score_q = clamp(5 + (deliveryRate - 0.7) * 10 - cancelled.length * 0.5)

  // C — preço médio estável (proxy: volume de pedidos)
  const score_c = clamp(5 + Math.min(orders.length, 10) * 0.3)

  // P — prazo médio de entrega (dias entre created e updated)
  const avgDays = delivered.length > 0
    ? delivered.reduce((acc, o) => {
        const days = (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / 86400000
        return acc + days
      }, 0) / delivered.length
    : 14
  const score_p = clamp(10 - avgDays * 0.3)

  // S — consistência operacional
  const score_s = clamp((score_q + score_p) / 2)

  return { score_q, score_c, score_p, score_s }
}

async function generateInsight(
  entityType: 'supplier' | 'project',
  name: string,
  scores: QcpsScores,
  context: string,
): Promise<string> {
  const avg = qcpsAverage(scores)
  const base = `${name}: QCPS médio ${avg}/10 (Q${scores.score_q} C${scores.score_c} P${scores.score_p} S${scores.score_s}). ${context}`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return base

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'Você é um analista de operações imobiliárias. Responda em 2 frases objetivas em português.',
          },
          {
            role: 'user',
            content: `Analise o ${entityType} "${name}" com scores QCPS: Q=${scores.score_q}, C=${scores.score_c}, P=${scores.score_p}, S=${scores.score_s}. Contexto: ${context}`,
          },
        ],
      }),
    })

    if (!res.ok) return base
    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() ?? base
  } catch {
    return base
  }
}

async function saveInsight(
  entityType: 'supplier' | 'project',
  entityId: string,
  insight: string,
  scores: QcpsScores,
) {
  const db = createServiceClient()
  await db.from('agent_insights').insert({
    entity_type: entityType,
    entity_id: entityId,
    insight,
    scores,
  } as never)
}

export async function scoreSupplier(supplierId: string) {
  const db = createServiceClient()

  const { data: supplier } = await db.from('suppliers').select('*').eq('id', supplierId).single() as {
    data: { name: string } | null
  }
  if (!supplier) throw new Error('Fornecedor não encontrado')

  const { data: orders } = await db.from('orders').select('status, total_price, created_at, updated_at').eq('supplier_id', supplierId)
  const scores = computeSupplierScores((orders ?? []) as OrderRow[])

  await db.from('suppliers').update({
    ...scores,
    homologation_tier: homologationTierFromQcps(qcpsAverage(scores)),
  } as never).eq('id', supplierId)

  const insight = await generateInsight(
    'supplier',
    supplier.name,
    scores,
    `${orders?.length ?? 0} pedidos registrados`,
  )
  await saveInsight('supplier', supplierId, insight, scores)

  return { scores, insight, average: qcpsAverage(scores) }
}

export async function scoreProject(projectId: string) {
  const db = createServiceClient()

  const { data: project } = await db.from('projects').select('*').eq('id', projectId).single() as {
    data: { name: string; phase: string } | null
  }
  if (!project) throw new Error('Empreendimento não encontrado')

  const { data: orders } = await db.from('orders').select('status, total_price, created_at, updated_at').eq('project_id', projectId)
  const orderScores = computeSupplierScores((orders ?? []) as OrderRow[])

  // Projeto: blend fase + performance de pedidos
  const phaseBonus: Record<string, number> = { A: 0, B: 0.5, C: 1, D: 1.5, E: 2, F: 3 }
  const bonus = phaseBonus[project.phase] ?? 0

  const scores: QcpsScores = {
    score_q: clamp(orderScores.score_q + bonus * 0.3),
    score_c: clamp(orderScores.score_c + bonus * 0.2),
    score_p: clamp(orderScores.score_p + bonus * 0.4),
    score_s: clamp(orderScores.score_s + bonus * 0.2),
  }

  await db.from('projects').update(scores as never).eq('id', projectId)

  const insight = await generateInsight(
    'project',
    project.name,
    scores,
    `Fase ${project.phase}, ${orders?.length ?? 0} pedidos vinculados`,
  )
  await saveInsight('project', projectId, insight, scores)

  return { scores, insight, average: qcpsAverage(scores) }
}
