import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { simular, SIMULATION_TEMPLATES } from '@/lib/simulation'
import { logActivity } from '@/lib/memory/events'

const schema = z.object({
  investimentoInicial: z.number().min(0),
  fluxosAnuais: z.array(z.number()),
  taxaDesconto: z.number().min(0).max(1),
  template: z.enum(['residencial', 'comercial']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    return ok({
      templates: SIMULATION_TEMPLATES,
      defaults: SIMULATION_TEMPLATES.residencial,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const body = await req.json()
    const input = schema.parse(body)

    const simInput = input.template
      ? { ...SIMULATION_TEMPLATES[input.template], ...input, template: undefined }
      : input

    const result = simular({
      investimentoInicial: simInput.investimentoInicial,
      fluxosAnuais: simInput.fluxosAnuais,
      taxaDesconto: simInput.taxaDesconto,
    })

    await logActivity({
      entityType: 'project',
      entityId: id,
      eventType: 'simulation.run',
      title: result.viavel ? 'Viabilidade aprovada' : 'Viabilidade reprovada',
      detail: result.resumo,
      metadata: result as unknown as Record<string, unknown>,
      actorId: profile!.id,
    })

    return ok(result)
  } catch (e) {
    return handleError(e)
  }
}
