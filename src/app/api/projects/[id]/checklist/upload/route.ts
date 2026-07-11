import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { auditChecklistEvidence, saveChecklistAudit } from '@/lib/agents/audit-agent'
import { mediaTypeFromMime } from '@/lib/llm-vision'
import type { ProjectPhase } from '@/lib/phases'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr
    if (profile!.role !== 'gestor') return err('Apenas gestor pode anexar evidências', 403)

    const { id: projectId } = await params
    const form = await req.formData()
    const file = form.get('file')
    const phase = z.enum(['A', 'B', 'C', 'D', 'E', 'F']).parse(form.get('phase'))
    const itemId = z.string().min(1).parse(form.get('itemId'))

    if (!(file instanceof File)) return err('Arquivo obrigatório', 422)
    if (file.size > MAX_BYTES) return err('Arquivo muito grande (máx. 10 MB)', 422)
    if (!ALLOWED.has(file.type)) return err('Tipo não permitido. Use PDF ou imagem.', 422)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const path = `projects/${projectId}/${phase}/${itemId}/${Date.now()}-${safeName}`

    const supabase = await createSupabaseServer()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabase.storage
      .from('checklist-evidence')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) return err(uploadErr.message, 500)

    const { data: signed, error: signErr } = await supabase.storage
      .from('checklist-evidence')
      .createSignedUrl(path, 60 * 60 * 24 * 7)

    if (signErr || !signed?.signedUrl) return err(signErr?.message ?? 'Erro ao gerar URL', 500)

    let audit = null
    let canAutoCheck = false
    let project = null
    if (mediaTypeFromMime(file.type)) {
      try {
        const result = await auditChecklistEvidence({
          projectId,
          phase: phase as ProjectPhase,
          itemId,
          filePath: path,
          fileName: file.name,
        })
        await saveChecklistAudit(projectId, phase as ProjectPhase, itemId, result.audit, {
          autoCheck: result.can_auto_check,
          filePath: path,
          fileName: file.name,
        })
        audit = result.audit
        canAutoCheck = result.can_auto_check
      } catch {
        // upload succeeds even if audit fails — still save file reference
        await saveChecklistAudit(projectId, phase as ProjectPhase, itemId, {
          status: 'pending',
          score: 0,
          summary: 'Auditoria automática indisponível — revise manualmente.',
          issues: [],
          ai_powered: false,
          audited_at: new Date().toISOString(),
        }, { filePath: path, fileName: file.name })
      }
    } else {
      await saveChecklistAudit(projectId, phase as ProjectPhase, itemId, {
        status: 'pending',
        score: 0,
        summary: 'PDF anexado — revise manualmente o documento.',
        issues: [],
        ai_powered: false,
        audited_at: new Date().toISOString(),
      }, { filePath: path, fileName: file.name })
    }

    const { data: updatedProject } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .eq('id', projectId)
      .single()
    project = updatedProject

    return ok({
      path,
      fileName: file.name,
      signedUrl: signed.signedUrl,
      phase: phase as ProjectPhase,
      itemId,
      audit,
      can_auto_check: canAutoCheck,
      project,
    })
  } catch (e) {
    return handleError(e)
  }
}
