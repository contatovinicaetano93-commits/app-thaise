import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { createServerClient } from '@/lib/supabase-server'
import { nextPhase, type ProjectPhase } from '@/lib/phases'

const schema = z.object({
  phase: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { phase: targetPhase } = schema.parse(body)
    const db = createServerClient()

    const { data: current, error: fetchErr } = await db
      .from('projects')
      .select('phase')
      .eq('id', id)
      .single() as { data: { phase: ProjectPhase } | null; error: { message: string } | null }

    if (fetchErr || !current) return err('Empreendimento não encontrado', 404)

    const currentPhase = current.phase
    const newPhase: ProjectPhase = targetPhase ?? nextPhase(currentPhase) ?? currentPhase

    if (!targetPhase && newPhase === currentPhase) {
      return err('Empreendimento já está na fase final', 400)
    }

    const updates: Record<string, unknown> = { phase: newPhase }
    if (newPhase === 'F') updates.status = 'completed'

    const { data, error } = await db
      .from('projects')
      .update(updates as never)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) return err(error.message, 500)
    return ok(data)
  } catch (e) {
    return handleError(e)
  }
}
