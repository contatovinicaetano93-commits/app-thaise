import { createServiceClient } from '@/lib/supabase-server'
import { auditAndInvalidate } from '@/lib/memory/audit'
import { notifyUser } from '@/lib/webhooks/dispatch'
import { generateWelcomeKitContent } from '@/lib/estlar/welcome-kit'
import type { Opportunity } from '@/types/database'

export interface ConvertResult {
  opportunity: Opportunity
  client: { id: string; name: string }
  project: { id: string; name: string }
}

export async function convertOpportunity(
  opportunityId: string,
  actorId: string,
  projectName?: string,
): Promise<ConvertResult> {
  const db = createServiceClient()

  const { data: opp, error: fetchErr } = await db
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single()

  if (fetchErr || !opp) throw new Error('Oportunidade não encontrada')

  const opportunity = opp as Opportunity
  if (opportunity.stage === 'ganho' && opportunity.client_id && opportunity.project_id) {
    throw new Error('Oportunidade já convertida')
  }
  if (opportunity.stage === 'perdido') {
    throw new Error('Oportunidade marcada como perdida')
  }
  if (!opportunity.signal_paid) {
    throw new Error('Valide o sinal financeiro antes de converter (marque na oportunidade)')
  }

  const { data: client, error: clientErr } = await db
    .from('clients')
    .insert({
      name: opportunity.name,
      email: opportunity.email,
      phone: opportunity.phone,
      company: opportunity.company ?? null,
      segment: 'Incorporadora',
      notes: opportunity.notes
        ? `Convertido do pipeline comercial.\n\n${opportunity.notes}`
        : 'Convertido do pipeline comercial.',
    } as never)
    .select()
    .single()

  if (clientErr) {
    if (clientErr.code === '23505') throw new Error('Este email já está cadastrado como cliente')
    throw new Error(clientErr.message)
  }

  const clientRow = client as { id: string; name: string; company?: string | null }
  const defaultProjectName = projectName?.trim()
    || `Obra Fechada — ${clientRow.company || clientRow.name}`

  const { data: project, error: projectErr } = await db
    .from('projects')
    .insert({
      name: defaultProjectName,
      client_id: clientRow.id,
      phase: 'A',
      status: 'active',
      description: 'Empreendimento aberto após fechamento comercial — execução via fornecedores terceirizados curados.',
      notes: opportunity.notes ?? null,
    } as never)
    .select()
    .single()

  if (projectErr) throw new Error(projectErr.message)

  const projectRow = project as { id: string; name: string }
  const now = new Date().toISOString()

  const { data: updated, error: updateErr } = await db
    .from('opportunities')
    .update({
      stage: 'ganho',
      client_id: clientRow.id,
      project_id: projectRow.id,
      closed_at: now,
    } as never)
    .eq('id', opportunityId)
    .select()
    .single()

  if (updateErr) throw new Error(updateErr.message)

  const welcomeContent = generateWelcomeKitContent({
    clientName: clientRow.name,
    projectName: projectRow.name,
    phase: 'A',
  })

  await db.from('welcome_kits').upsert({
    project_id: projectRow.id,
    content: welcomeContent,
    generated_at: now,
  } as never, { onConflict: 'project_id' })

  await auditAndInvalidate({
    entityType: 'client',
    entityId: clientRow.id,
    eventType: 'client.created',
    title: 'Cliente convertido do pipeline',
    detail: clientRow.name,
    actorId,
    cachePrefix: 'clients',
    metadata: { opportunity_id: opportunityId },
  })

  await auditAndInvalidate({
    entityType: 'project',
    entityId: projectRow.id,
    eventType: 'project.created',
    title: 'Empreendimento Fase A — pós-fechamento',
    detail: projectRow.name,
    actorId,
    cachePrefix: 'projects',
    metadata: { opportunity_id: opportunityId, source: 'pipeline_convert' },
  })

  await auditAndInvalidate({
    entityType: 'opportunity',
    entityId: opportunityId,
    eventType: 'opportunity.converted',
    title: 'Negócio ganho — Obra Fechada',
    detail: `${clientRow.name} → ${projectRow.name}`,
    actorId,
    cachePrefix: 'opportunities',
    metadata: { client_id: clientRow.id, project_id: projectRow.id },
  })

  const { data: gestores } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'gestor') as { data: Array<{ id: string }> | null }

  const notifyBody = `${clientRow.name} — iniciar Programa de Necessidades e checklist Fase A.`
  for (const g of gestores ?? []) {
    await notifyUser(
      g.id,
      'Novo empreendimento — Obra Fechada fechada',
      notifyBody,
      `/projects?open=${projectRow.id}`,
    )
  }

  return {
    opportunity: updated as Opportunity,
    client: clientRow,
    project: projectRow,
  }
}
