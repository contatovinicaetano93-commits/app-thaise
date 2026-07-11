/**
 * Agente de Auditoria Visual — analisa evidências fotográficas do checklist
 * contra padrão ESTLAR. Gestor confirma ou sobrescreve a sugestão da IA.
 */

import { PHASE_CHECKLISTS } from '@/lib/checklists'
import { auditCriteriaFor, auditStatusFromScore } from '@/lib/audits/standards'
import { analyzeImage, isVisionConfigured, mediaTypeFromMime, type VisionMediaType } from '@/lib/llm-vision'
import { createServiceClient } from '@/lib/supabase-server'
import type { EvidenceAudit, PhaseChecklist } from '@/lib/auth/roles'
import type { ProjectPhase } from '@/lib/phases'

export interface AuditRunResult {
  audit: EvidenceAudit
  can_auto_check: boolean
}

interface ParsedVisionAudit {
  score: number
  summary: string
  issues: string[]
  recommendation: 'approve' | 'reject' | 'review'
}

function clampScore(n: number): number {
  return Math.round(Math.min(10, Math.max(0, n)) * 10) / 10
}

function pendingAudit(summary: string, aiPowered = false): EvidenceAudit {
  return {
    status: 'pending',
    score: 0,
    summary,
    issues: [],
    ai_powered: aiPowered,
    audited_at: new Date().toISOString(),
  }
}

function parseVisionResponse(raw: string): ParsedVisionAudit | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedVisionAudit>
    if (typeof parsed.score !== 'number' || !parsed.summary) return null
    return {
      score: clampScore(parsed.score),
      summary: parsed.summary.trim(),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String).slice(0, 6) : [],
      recommendation: parsed.recommendation === 'approve' || parsed.recommendation === 'reject'
        ? parsed.recommendation
        : 'review',
    }
  } catch {
    return null
  }
}

async function downloadImageBase64(filePath: string): Promise<{ base64: string; mediaType: VisionMediaType } | null> {
  const db = createServiceClient()
  const { data, error } = await db.storage.from('checklist-evidence').download(filePath)
  if (error || !data) return null

  const buffer = Buffer.from(await data.arrayBuffer())
  const mime = data.type || 'image/jpeg'
  const mediaType = mediaTypeFromMime(mime)
  if (!mediaType) return null

  return { base64: buffer.toString('base64'), mediaType }
}

export async function auditChecklistEvidence(input: {
  projectId: string
  phase: ProjectPhase
  itemId: string
  filePath: string
  fileName?: string
  projectName?: string
}): Promise<AuditRunResult> {
  const item = PHASE_CHECKLISTS[input.phase].find(i => i.id === input.itemId)
  if (!item) throw new Error('Item de checklist inválido')

  const criteria = auditCriteriaFor(input.phase, input.itemId, item.label)
  const isPdf = input.fileName?.toLowerCase().endsWith('.pdf') || input.filePath.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    return {
      audit: pendingAudit('PDF anexado — auditoria visual automática não se aplica. Revise manualmente o documento.'),
      can_auto_check: false,
    }
  }

  const image = await downloadImageBase64(input.filePath)
  if (!image) {
    return {
      audit: pendingAudit('Não foi possível ler a imagem. Reenvie o arquivo ou revise manualmente.'),
      can_auto_check: false,
    }
  }

  if (!isVisionConfigured()) {
    return {
      audit: pendingAudit('IA de visão não configurada — revise a foto manualmente e aprove a evidência.'),
      can_auto_check: false,
    }
  }

  const raw = await analyzeImage({
    imageBase64: image.base64,
    mediaType: image.mediaType,
    systemPrompt: `Você é auditor de qualidade do Hub Estlar (arquitetura curada).
Avalie se a evidência fotográfica atende o padrão ESTLAR para o item do checklist.
Responda APENAS JSON válido:
{"score":0-10,"summary":"2 frases em português","issues":["problema1"],"recommendation":"approve"|"reject"|"review"}
Score >= 7 = padrão atingido. Seja objetivo e cite o que vê na imagem.`,
    userPrompt: JSON.stringify({
      obra: input.projectName ?? input.projectId,
      fase: input.phase,
      item: criteria.label,
      criterios: criteria.focus,
      arquivo: input.fileName ?? input.filePath,
    }),
  })

  if (!raw) {
    return {
      audit: pendingAudit('Falha na análise da IA — revise manualmente a evidência.'),
      can_auto_check: false,
    }
  }

  const parsed = parseVisionResponse(raw)
  if (!parsed) {
    return {
      audit: pendingAudit('Resposta da IA inválida — revise manualmente a evidência.'),
      can_auto_check: false,
    }
  }

  const status = parsed.recommendation === 'reject'
    ? 'failed'
    : parsed.recommendation === 'approve'
      ? auditStatusFromScore(parsed.score)
      : auditStatusFromScore(parsed.score)

  const audit: EvidenceAudit = {
    status,
    score: parsed.score,
    summary: parsed.summary,
    issues: parsed.issues,
    ai_powered: true,
    audited_at: new Date().toISOString(),
  }

  return {
    audit,
    can_auto_check: status === 'passed',
  }
}

export function applyAuditDecision(
  audit: EvidenceAudit,
  decision: 'approve' | 'reject' | 'override',
  actorId: string,
): EvidenceAudit {
  const now = new Date().toISOString()
  if (decision === 'approve') {
    return { ...audit, status: 'passed', approved_by: actorId, approved_at: now }
  }
  if (decision === 'reject') {
    return { ...audit, status: 'failed', approved_by: actorId, approved_at: now }
  }
  return { ...audit, status: 'override', approved_by: actorId, approved_at: now }
}

export function isAuditBlockingCheck(audit: EvidenceAudit | undefined): boolean {
  if (!audit) return false
  return audit.status === 'failed' || audit.status === 'pending'
}

export function getChecklistItemAudit(
  checklist: PhaseChecklist | null | undefined,
  phase: ProjectPhase,
  itemId: string,
): EvidenceAudit | undefined {
  const raw = checklist?.[phase]?.[itemId]
  if (raw && typeof raw === 'object' && 'audit' in raw && raw.audit) {
    return raw.audit
  }
  return undefined
}

export async function saveChecklistAudit(
  projectId: string,
  phase: ProjectPhase,
  itemId: string,
  audit: EvidenceAudit,
  opts?: { autoCheck?: boolean; filePath?: string; fileName?: string },
) {
  const db = createServiceClient()
  const { data: project } = await db
    .from('projects')
    .select('checklist, phase')
    .eq('id', projectId)
    .single() as { data: { checklist: PhaseChecklist; phase: ProjectPhase } | null }

  if (!project) throw new Error('Obra não encontrada')
  if (project.phase !== phase) throw new Error('Só é possível auditar a fase atual')

  const checklist = { ...(project.checklist ?? {}) } as PhaseChecklist
  const prev = checklist[phase]?.[itemId]
  const prevObj = prev && typeof prev === 'object' && 'checked' in prev ? prev : null

  const checked = opts?.autoCheck && (audit.status === 'passed' || audit.status === 'override')
    ? true
    : (prevObj?.checked ?? false)

  checklist[phase] = {
    ...(checklist[phase] ?? {}),
    [itemId]: {
      checked,
      evidence: prevObj?.evidence,
      filePath: opts?.filePath ?? prevObj?.filePath,
      fileName: opts?.fileName ?? prevObj?.fileName,
      audit,
    },
  }

  await db.from('projects').update({ checklist } as never).eq('id', projectId)
  return checklist
}
