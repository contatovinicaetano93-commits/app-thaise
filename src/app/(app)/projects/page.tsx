'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Building2, Pencil, Trash2, MapPin, Sparkles, FileText } from 'lucide-react'
import { SimulationPanel } from '@/components/projects/SimulationPanel'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PhaseStepper } from '@/components/ui/PhaseStepper'
import { PhaseChecklist } from '@/components/ui/PhaseChecklist'
import { QcpsBar } from '@/components/ui/QcpsBar'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import { projectsApi, agentsApi } from '@/lib/api'
import { isPhaseComplete, phaseProgress } from '@/lib/checklists'
import { PHASES } from '@/lib/phases'
import { PHASE_PROMPTS } from '@/lib/phase-prompts'
import { useDebounce } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Project } from '@/types/database'
import type { PhaseChecklist as PhaseChecklistType } from '@/lib/auth/roles'

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo', paused: 'Pausado', completed: 'Concluído', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function ProjectsPage() {
  const { isGestor } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>()
  const [deleting, setDeleting] = useState<Project | undefined>()
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [scoring, setScoring] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await projectsApi.list())
    } catch {
      toast.error('Erro ao carregar empreendimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdvance(id: string) {
    setAdvancing(id)
    try {
      const updated = await projectsApi.advancePhase(id)
      setProjects(prev => prev.map(p => p.id === id ? updated : p))
      toast.success(`Avançou para Fase ${updated.phase}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao avançar fase')
    } finally {
      setAdvancing(null)
    }
  }

  async function handleChecklistToggle(project: Project, itemId: string, checked: boolean) {
    try {
      const updated = await projectsApi.updateChecklist(project.id, project.phase, itemId, checked)
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar checklist')
    }
  }

  async function handleScore(projectId: string) {
    setScoring(projectId)
    try {
      const result = await agentsApi.scoreProject(projectId)
      toast.success(`QCPS recalculado: ${result.average}/10`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro no agente')
    } finally {
      setScoring(null)
    }
  }

  async function handleSummary(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/summary`, { method: 'POST' })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      toast.success('Resumo gerado — veja em Insights AI')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar resumo')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await projectsApi.remove(deleting.id)
      toast.success('Empreendimento removido')
      setDeleting(undefined)
      load()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.location ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.client?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesStatus = !statusFilter || p.status === statusFilter
    const matchesPhase = !phaseFilter || p.phase === phaseFilter
    return matchesSearch && matchesStatus && matchesPhase
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empreendimentos</h2>
          <p className="text-gray-500 mt-1 text-sm">Jornada guiada A → F · checklist obrigatório</p>
        </div>
        {isGestor && (
          <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
            <Plus size={16} />Novo
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, local ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={phaseFilter}
          onChange={e => setPhaseFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Todas as fases</option>
          {PHASES.map(p => (
            <option key={p.id} value={p.id}>Fase {p.id} — {p.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <ListSkeleton rows={2} height="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          iconClass="text-violet-600"
          title={search || statusFilter || phaseFilter ? 'Nenhum resultado' : 'Nenhum empreendimento ainda'}
          description={
            search || statusFilter || phaseFilter
              ? 'Ajuste os filtros ou tente outro termo.'
              : 'Crie o primeiro e acompanhe as fases A até F.'
          }
          actionLabel={isGestor && !search && !statusFilter && !phaseFilter ? 'Novo Empreendimento' : undefined}
          onAction={isGestor && !search && !statusFilter && !phaseFilter ? () => { setEditing(undefined); setModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map(project => {
            const checklist = (project.checklist ?? {}) as PhaseChecklistType
            const canAdvance = isPhaseComplete(project.phase, checklist)
            const progress = phaseProgress(project.phase, checklist)

            return (
              <div key={project.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[project.status]}`}>
                        {STATUS_LABEL[project.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {project.client && <span className="flex items-center gap-1"><Building2 size={12} />{project.client.name}</span>}
                      {project.location && <span className="flex items-center gap-1"><MapPin size={12} />{project.location}</span>}
                    </div>
                  </div>
                  {isGestor && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSummary(project.id)}
                        title="Gerar resumo para o cliente"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        onClick={() => handleScore(project.id)}
                        disabled={scoring === project.id}
                        title="Recalcular QCPS com agente AI"
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                      >
                        <Sparkles size={15} />
                      </button>
                      <button onClick={() => { setEditing(project); setModalOpen(true) }} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleting(project)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 mb-3">
                  {PHASE_PROMPTS[project.phase].guia}
                </p>

                <PhaseStepper
                  current={project.phase}
                  onAdvance={isGestor ? () => handleAdvance(project.id) : undefined}
                  advancing={advancing === project.id}
                  canAdvance={canAdvance}
                />

                <PhaseChecklist
                  phase={project.phase}
                  checklist={checklist}
                  onToggle={(itemId, checked) => handleChecklistToggle(project, itemId, checked)}
                  readOnly={!isGestor}
                />

                {!canAdvance && progress.total > 0 && (
                  <p className="text-xs text-amber-600 mt-2">{PHASE_PROMPTS[project.phase].pergunta}</p>
                )}

                <SimulationPanel projectId={project.id} phase={project.phase} />

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <QcpsBar scores={project} />
                </div>

                <ActivityTimeline entityType="project" entityId={project.id} />
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Empreendimento' : 'Novo Empreendimento'} size="lg">
        <ProjectForm project={editing} onSuccess={() => { setModalOpen(false); load() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(undefined)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-5">Remover <strong>{deleting?.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
