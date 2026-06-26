import { NextRequest } from 'next/server'
import { ok, handleError } from '@/lib/api-response'
import { createSupabaseServer } from '@/lib/supabase/server'
import { requireGestor } from '@/lib/auth/api-context'
import { generateProposalContent } from '@/lib/estlar/proposal'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr
    const { id } = await params
    const db = await createSupabaseServer()

    const { data: opp } = await db.from('opportunities').select('*').eq('id', id).single()
    if (!opp) return handleError(new Error('Oportunidade não encontrada'))

    const o = opp as {
      name: string
      company?: string | null
      fee_model?: string | null
      fee_fixed?: number | null
      fee_variable_pct?: number | null
      budget_estimate?: number | null
    }

    const content = generateProposalContent({
      clientName: o.name,
      projectName: o.company ? `${o.company} — ${o.name}` : o.name,
      feeModel: o.fee_model ?? 'fixo',
      feeFixed: o.fee_fixed ?? undefined,
      feeVariablePct: o.fee_variable_pct ?? undefined,
      totalInvestment: o.budget_estimate ?? undefined,
      estimatedDays: 60,
    })

    return ok({ content })
  } catch (e) {
    return handleError(e)
  }
}
