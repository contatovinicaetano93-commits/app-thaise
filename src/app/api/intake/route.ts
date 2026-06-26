import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, handleError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase-server'
import { scoreIntake } from '@/lib/intake'
import { briefingTypeFromScope } from '@/lib/briefing'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { notifyUser } from '@/lib/webhooks/dispatch'

const intakeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional().transform(v => v || null),
  source: z.enum(['whatsapp', 'indicacao', 'instagram', 'parceiro', 'evento', 'outro']).default('whatsapp'),
  scope: z.enum(['corporativo', 'residencial', 'comercial', 'desenvolvimento', 'outro']),
  intervention: z.enum(['projeto_curadoria', 'reforma_parcial', 'construcao_zero', 'turnkey']),
  budget: z.enum(['ate_150k', '150k_500k', 'acima_500k', 'acima_1m']),
  urgency: z.enum(['sem_pressa', '6_meses', 'urgente']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = intakeSchema.parse(body)
    const intake_data = {
      scope: payload.scope,
      intervention: payload.intervention,
      budget: payload.budget,
      urgency: payload.urgency,
    }
    const { score, status, reason } = scoreIntake(intake_data)

    const db = createServiceClient()
    const { data, error } = await db
      .from('opportunities')
      .insert({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company,
        source: payload.source,
        stage: status === 'approved' ? 'briefing' : 'primeiro_contato',
        intake_data,
        intake_score: score,
        intake_status: status,
        briefing_type: briefingTypeFromScope(payload.scope),
        notes: `Intake automático — ${reason}`,
      } as never)
      .select()
      .single()

    if (error) return handleError(new Error(error.message))

    const row = data as { id: string; name: string }
    await auditAndInvalidate({
      entityType: 'opportunity',
      entityId: row.id,
      eventType: 'opportunity.intake',
      title: 'Intake público recebido',
      detail: `${row.name} — score ${score} (${status})`,
      cachePrefix: 'opportunities',
    })

    const { data: gestores } = await db.from('profiles').select('id').eq('role', 'gestor') as {
      data: Array<{ id: string }> | null
    }

    for (const g of gestores ?? []) {
      await notifyUser(
        g.id,
        status === 'approved' ? 'Novo lead qualificado' : 'Novo intake para revisão',
        `${payload.name} — ${reason}`,
        '/pipeline',
      )
    }

    return ok({ opportunity: data, score, status, reason }, undefined, 201)
  } catch (e) {
    return handleError(e)
  }
}
