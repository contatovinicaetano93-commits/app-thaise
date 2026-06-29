'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProjectProgressBar } from '@/components/projects/ProjectProgressBar'
import { projectsApi } from '@/lib/api'
import { validatePhaseWeights } from '@/lib/projects/default-phases'
import { toast } from 'sonner'
import type { Project, ProjectPhaseRow } from '@/types/database'

interface PhaseDraft {
  key: string
  id?: string
  name: string
  weight_pct: number
}

interface Props {
  project: Project
  onUpdate: (updated: Project) => void
}

function draftFromProject(project: Project): PhaseDraft[] {
  const phases = project.phases ?? []
  if (phases.length === 0) {
    return [{ key: '0', name: 'Projeto', weight_pct: 100 }]
  }
  return phases.map(p => ({
    key: p.id,
    id: p.id,
    name: p.name,
    weight_pct: Number(p.weight_pct),
  }))
}

export function ProjectPhasesPanel({ project, onUpdate }: Props) {
  const [drafts, setDrafts] = useState<PhaseDraft[]>(() => draftFromProject(project))
  const [progressPct, setProgressPct] = useState(project.progress_pct ?? 0)
  const [currentPhaseId, setCurrentPhaseId] = useState(project.current_phase_id ?? project.phases?.[0]?.id ?? '')
  const [portalEnabled, setPortalEnabled] = useState(project.portal_enabled ?? false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDrafts(draftFromProject(project))
    setProgressPct(project.progress_pct ?? 0)
    setCurrentPhaseId(project.current_phase_id ?? project.phases?.[0]?.id ?? '')
    setPortalEnabled(project.portal_enabled ?? false)
  }, [project])

  const weightSum = drafts.reduce((a, d) => a + (Number(d.weight_pct) || 0), 0)

  function updateDraft(index: number, patch: Partial<PhaseDraft>) {
    setDrafts(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function addPhase() {
    setDrafts(prev => [...prev, { key: `new-${Date.now()}`, name: '', weight_pct: 0 }])
  }

  function removePhase(index: number) {
    if (drafts.length <= 1) return
    setDrafts(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const err = validatePhaseWeights(drafts.map(d => Number(d.weight_pct) || 0))
    if (err) {
      toast.error(err)
      return
    }
    if (drafts.some(d => !d.name.trim())) {
      toast.error('Preencha o nome de todas as fases')
      return
    }

    setSaving(true)
    try {
      const phases = await projectsApi.savePhases(project.id, drafts.map(d => ({
        id: d.id,
        name: d.name.trim(),
        weight_pct: Number(d.weight_pct),
      })))

      let updated = await projectsApi.updateProgress(project.id, {
        progress_pct: progressPct,
        current_phase_id: currentPhaseId || null,
        portal_enabled: portalEnabled,
      })

      const phaseList = phases as ProjectPhaseRow[]
      updated = {
        ...updated,
        phases: phaseList,
        current_phase: phaseList.find(p => p.id === updated.current_phase_id) ?? null,
      }
      onUpdate(updated)
      toast.success(portalEnabled ? 'Obra salva — portal liberado' : 'Obra atualizada')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const previewProject: Project = {
    ...project,
    progress_pct: progressPct,
    current_phase_id: currentPhaseId,
    phases: drafts.map((d, i) => ({
      id: d.id ?? d.key,
      project_id: project.id,
      name: d.name,
      sort_order: i,
      weight_pct: Number(d.weight_pct) || 0,
      created_at: '',
      updated_at: '',
    })),
    current_phase: drafts.find(d => (d.id ?? d.key) === currentPhaseId)
      ? {
          id: currentPhaseId,
          project_id: project.id,
          name: drafts.find(d => (d.id ?? d.key) === currentPhaseId)!.name,
          sort_order: 0,
          weight_pct: 0,
          created_at: '',
          updated_at: '',
        }
      : null,
  }

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">Fases da obra</p>
          <p className="text-xs text-gray-500">Defina etapas e pesos — soma deve ser 100%</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          Math.abs(weightSum - 100) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
        }`}>
          Total: {weightSum.toFixed(1)}%
        </span>
      </div>

      <div className="space-y-2">
        {drafts.map((d, i) => (
          <div key={d.key} className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <Input
                label={i === 0 ? 'Fase' : '\u00a0'}
                value={d.name}
                onChange={e => updateDraft(i, { name: e.target.value })}
                placeholder="Nome da fase"
              />
            </div>
            <div className="w-24">
              <Input
                label={i === 0 ? 'Peso %' : '\u00a0'}
                type="number"
                min={0.01}
                max={100}
                step={0.5}
                value={d.weight_pct}
                onChange={e => updateDraft(i, { weight_pct: Number(e.target.value) })}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 mb-0.5"
              onClick={() => removePhase(i)}
              disabled={drafts.length <= 1}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addPhase} className="text-xs">
        <Plus size={14} /> Adicionar fase
      </Button>

      <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-violet-100">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Fase atual</label>
          <select
            value={currentPhaseId}
            onChange={e => setCurrentPhaseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {drafts.filter(d => d.name.trim()).map(d => (
              <option key={d.key} value={d.id ?? d.key}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Progresso manual (%)</label>
          <input
            type="range"
            min={0}
            max={100}
            value={progressPct}
            onChange={e => setProgressPct(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
          <p className="text-center text-sm font-bold text-violet-700 mt-1">{progressPct}%</p>
        </div>
      </div>

      <ProjectProgressBar project={previewProject} />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-violet-100">
        <button
          type="button"
          onClick={() => setPortalEnabled(v => !v)}
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
            portalEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-gray-200 bg-white text-gray-600'
          }`}
        >
          {portalEnabled ? <Globe size={16} /> : <Lock size={16} />}
          {portalEnabled ? 'Portal do cliente liberado' : 'Portal do cliente bloqueado'}
        </button>
        <Button onClick={handleSave} loading={saving}>
          <Save size={16} /> Salvar obra
        </Button>
      </div>

      {portalEnabled && project.client_id && (
        <p className="text-xs text-emerald-700">
          Cliente pode acessar após convite em Convidar usuário.
        </p>
      )}
    </div>
  )
}
