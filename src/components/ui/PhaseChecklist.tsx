'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Paperclip, ExternalLink, Loader2 } from 'lucide-react'
import { PHASE_CHECKLISTS, phaseProgress, isChecklistItemDone } from '@/lib/checklists'
import type { ProjectPhase } from '@/lib/phases'
import type { ChecklistItemValue, PhaseChecklist } from '@/lib/auth/roles'
import { toast } from 'sonner'

interface Props {
  phase: ProjectPhase
  checklist: PhaseChecklist
  onToggle: (itemId: string, checked: boolean, evidence?: string) => void
  onAttach?: (itemId: string, file: File) => Promise<void>
  readOnly?: boolean
}

function getMeta(value: ChecklistItemValue | undefined) {
  if (!value || typeof value !== 'object' || !('checked' in value)) {
    return { evidence: '', fileName: '', filePath: '' }
  }
  return {
    evidence: value.evidence ?? '',
    fileName: value.fileName ?? '',
    filePath: value.filePath ?? '',
  }
}

export function PhaseChecklist({ phase, checklist, onToggle, onAttach, readOnly }: Props) {
  const items = PHASE_CHECKLISTS[phase]
  const { done, total } = phaseProgress(phase, checklist)
  const phaseDone = checklist[phase] ?? {}
  const [uploading, setUploading] = useState<string | null>(null)

  async function handleFile(itemId: string, file: File | undefined) {
    if (!file || !onAttach) return
    setUploading(itemId)
    try {
      await onAttach(itemId, file)
      toast.success('Anexo enviado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-600">Checklist · Fase {phase}</p>
        <span className={`text-xs font-semibold ${done === total ? 'text-emerald-600' : 'text-amber-600'}`}>
          {done}/{total}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map(item => {
          const value = phaseDone[item.id]
          const checked = isChecklistItemDone(value)
          const { evidence, fileName, filePath } = getMeta(value)
          const busy = uploading === item.id

          return (
            <li key={item.id} className="space-y-1.5">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onToggle(item.id, !checked, evidence || undefined)}
                className={`flex items-start gap-2 w-full text-left text-sm transition-colors ${
                  readOnly ? 'cursor-default' : 'hover:text-violet-700 cursor-pointer'
                } ${checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}
              >
                {checked
                  ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <Circle size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                }
                <span>{item.label}</span>
              </button>
              {!readOnly && (
                <div className="ml-6 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Evidência (link ou nota)"
                    value={evidence}
                    onChange={e => onToggle(item.id, checked, e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-gray-100 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-violet-600 cursor-pointer hover:text-violet-800">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                    {fileName ? `Trocar anexo (${fileName})` : 'Anexar PDF ou imagem'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      disabled={busy || !onAttach}
                      onChange={e => handleFile(item.id, e.target.files?.[0])}
                    />
                  </label>
                  {fileName && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <ExternalLink size={12} />
                      {fileName}
                      {filePath && <span className="text-gray-300">· salvo no storage</span>}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
