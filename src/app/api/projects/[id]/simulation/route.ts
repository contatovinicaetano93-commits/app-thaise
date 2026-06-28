import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { assertEntityAccess } from '@/lib/auth/entity-access'
import { simular, SIMULATION_TEMPLATES } from '@/lib/simulation'
import { logActivity } from '@/lib/memory/events'

const schema = z.object({
  investimentoInicial: z.number().min(0).optional(),
  fluxosAnuais: z.array(z.number()).optional(),
  taxaDesconto: z.number().min(0).max(1).optional(),
  template: z.enum(['residencial', 'comercial']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const { id } = await params
    const accessErr = await assertEntityAccess(profile!, 'project', id)
    if (accessErr) return accessErr

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
    const accessErr = await assertEntityAccess(profile!, 'project', id)
    if (accessErr) return accessErr

    const body = await req.json()
    const input = schema.parse(body)

    const tpl = input.template ? SIMULATION_TEMPLATES[input.template] : null
    const investimentoInicial = input.investimentoInicial ?? tpl?.investimentoInicial
    const fluxosAnuais = input.fluxosAnuais ?? tpl?.fluxosAnuais
    const taxaDesconto = input.taxaDesconto ?? tpl?.taxaDesconto

    if (investimentoInicial === undefined || !fluxosAnuais?.length || taxaDesconto === undefined) {
      return err('Informe template ou investimentoInicial, fluxosAnuais e taxaDesconto', 422)
    }

    const result = simular({
      investimentoInicial,
      fluxosAnuais: [...fluxosAnuais],
      taxaDesconto,
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
