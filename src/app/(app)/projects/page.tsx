'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Building2, MapPin } from 'lucide-react'
import { SimulationPanel } from '@/components/projects/SimulationPanel'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PhaseStepper } from '@/components/ui/PhaseStepper'
import { PhaseChecklist } from '@/components/ui/PhaseChecklist'
import { QcpsBar } from '@/components/ui/QcpsBar'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { useAuth } from '@/components/auth/AuthProvider'
import { projectsApi, agentsApi } from '@/lib/api'
import { isPhaseComplete, phaseProgress } from '@/lib/checklists'
import { ProjectOpsPanel } from '@/components/projects/ProjectOpsPanel'
import { ProjectRiskBadge } from '@/components/projects/ProjectRiskBadge'
import { CLIENT_PHASE_LABELS, PHASES } from '@/lib/phases'
import { PHASE_PROMPTS } from '@/lib/phase-prompts'
import { useDebounce, useLiveRefresh } from '@/lib/hooks'
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
  return (
    <Suspense fallback={<ListSkeleton rows={4} height="h-14" />}>
      <ProjectsPageContent />
    </Suspense>
  )
}

function ProjectsPageContent() {
  const { isGestor, role } = useAuth()
  const searchParams = useSearchParams()
  const openFromQuery = searchParams.get('open')
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
  const [forceOpenId, setForceOpenId] = useState<string | null>(null)
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
  useLiveRefresh(load, ['projects'])

  useEffect(() => {
    if (openFromQuery) setForceOpenId(openFromQuery)
  }, [openFromQuery])

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

  async function handleChecklistToggle(project: Project, itemId: string, checked: boolean, evidence?: string) {
    try {
      const updated = await projectsApi.updateChecklist(project.id, project.phase, itemId, checked, { evidence })
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar checklist')
    }
  }

  async function handleChecklistAttach(project: Project, itemId: string, file: File) {
    const uploaded = await projectsApi.uploadChecklistFile(project.id, project.phase, itemId, file)
    const value = phaseDone(project, itemId)
    const checked = value?.checked ?? true
    const updated = await projectsApi.updateChecklist(project.id, project.phase, itemId, checked, {
      evidence: value?.evidence,
      filePath: uploaded.path,
      fileName: uploaded.fileName,
    })
    setProjects(prev => prev.map(p => p.id === project.id ? updated : p))
  }

  function phaseDone(project: Project, itemId: string) {
    const checklist = (project.checklist ?? {}) as PhaseChecklistType
    const raw = checklist[project.phase]?.[itemId]
    if (raw && typeof raw === 'object' && 'checked' in raw) return raw
    return undefined
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
      <PageFeedHeader
        title="Empreendimentos"
        subtitle="Jornada guiada A → F · checklist obrigatório"
        menuItems={isGestor ? [
          { label: 'Novo empreendimento', onClick: () => { setEditing(undefined); setModalOpen(true) } },
        ] : role === 'cliente' ? [
          { label: 'Ver pedidos', href: '/orders' },
        ] : undefined}
      />

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

      {!loading && filtered.length > 0 && (
        <PanelToolbar
          sections={filtered.map(p => ({ id: `project-${p.id}`, priority: 'secondary' as const }))}
          className="mb-2"
        />
      )}

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
        <div className="space-y-2">
          {filtered.map(project => {
            const checklist = (project.checklist ?? {}) as PhaseChecklistType
            const canAdvance = isPhaseComplete(project.phase, checklist)
            const progress = phaseProgress(project.phase, checklist)

            return (
              <PanelCard
                key={project.id}
                panelId={`project-${project.id}`}
                title={project.name}
                defaultOpen={forceOpenId === project.id}
                summary={[
                  role === 'cliente' ? CLIENT_PHASE_LABELS[project.phase].label : `Fase ${project.phase}`,
                  project.client?.name,
                  project.location,
                  STATUS_LABEL[project.status],
                ].filter(Boolean).join(' · ')}
                headerExtra={
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[project.status]}`}>
                    {STATUS_LABEL[project.status]}
                  </span>
                }
                menuItems={isGestor ? [
                  { label: 'Gerar resumo', onClick: () => handleSummary(project.id) },
                  { label: 'Recalcular QCPS', onClick: () => handleScore(project.id), disabled: scoring === project.id },
                  { label: 'Editar', onClick: () => { setEditing(project); setModalOpen(true) } },
                  { label: 'Excluir', onClick: () => setDeleting(project), danger: true },
                ] : role === 'cliente' ? [
                  { label: 'Ver pedidos', href: '/orders' },
                ] : undefined}
              >
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                  {project.client && <span className="flex items-center gap-1"><Building2 size={12} />{project.client.name}</span>}
                  {project.location && <span className="flex items-center gap-1"><MapPin size={12} />{project.location}</span>}
                </div>

                <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 mb-3">
                  {PHASE_PROMPTS[project.phase].guia}
                </p>

                <ProjectRiskBadge projectId={project.id} />

                <PhaseStepper
                  current={project.phase}
                  clientView={role === 'cliente'}
                  onAdvance={isGestor ? () => handleAdvance(project.id) : undefined}
                  advancing={advancing === project.id}
                  canAdvance={canAdvance}
                />

                <PhaseChecklist
                  phase={project.phase}
                  checklist={checklist}
                  onToggle={(itemId, checked, evidence) => handleChecklistToggle(project, itemId, checked, evidence)}
                  onAttach={isGestor ? (itemId, file) => handleChecklistAttach(project, itemId, file) : undefined}
                  readOnly={!isGestor}
                />

                {!canAdvance && progress.total > 0 && (
                  <p className="text-xs text-amber-600 mt-2">{PHASE_PROMPTS[project.phase].pergunta}</p>
                )}

                <SimulationPanel projectId={project.id} phase={project.phase} />

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <QcpsBar scores={project} />
                </div>

                {isGestor ? (
                  <ProjectOpsPanel projectId={project.id} projectName={project.name} />
                ) : role === 'cliente' ? (
                  <ProjectOpsPanel projectId={project.id} projectName={project.name} readOnly />
                ) : null}

                <ActivityTimeline entityType="project" entityId={project.id} />
              </PanelCard>
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
