'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Building2, MapPin, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { useAuth } from '@/components/auth/AuthProvider'
import { projectsApi } from '@/lib/api'
import { ProjectProgressBar } from '@/components/projects/ProjectProgressBar'
import { useDebounce, useLiveRefresh } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Project } from '@/types/database'
import { inviteUserUrl, skuRequestCreateUrl, quoteCreateUrl } from '@/lib/flow-links'

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
  const newFromQuery = searchParams.get('new') === '1'
  const clientIdFromQuery = searchParams.get('client_id') ?? undefined
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>()
  const [deleting, setDeleting] = useState<Project | undefined>()
  const [forceOpenId, setForceOpenId] = useState<string | null>(null)
  const [newClientId, setNewClientId] = useState<string | undefined>()
  const [progressDraft, setProgressDraft] = useState<Record<string, string>>({})
  const [savingProgress, setSavingProgress] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await projectsApi.list())
    } catch {
      toast.error('Erro ao carregar obras')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['projects'])

  useEffect(() => {
    if (openFromQuery) setForceOpenId(openFromQuery)
  }, [openFromQuery])

  useEffect(() => {
    if (newFromQuery && isGestor) {
      setEditing(undefined)
      setNewClientId(clientIdFromQuery)
      setModalOpen(true)
    }
  }, [newFromQuery, clientIdFromQuery, isGestor])

  function openNewProject(clientId?: string) {
    setEditing(undefined)
    setNewClientId(clientId)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await projectsApi.remove(deleting.id)
      toast.success('Obra removida')
      setDeleting(undefined)
      load()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  async function saveProgress(project: Project) {
    const raw = progressDraft[project.id] ?? String(project.progress_pct ?? 0)
    const pct = Math.min(100, Math.max(0, Number(raw)))
    if (Number.isNaN(pct)) {
      toast.error('Progresso inválido')
      return
    }
    setSavingProgress(project.id)
    try {
      const updated = await projectsApi.updateProgress(project.id, { progress_pct: pct })
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...updated } : p))
      toast.success('Progresso atualizado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar progresso')
    } finally {
      setSavingProgress(null)
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.location ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.client?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesStatus = !statusFilter || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <PageFeedHeader
        title={role === 'cliente' ? 'Minha obra' : 'Obras'}
        subtitle="Container da obra · progresso e fluxo com fornecedor/cliente"
        menuItems={isGestor ? [
          { label: 'Nova obra', onClick: () => openNewProject() },
          { label: 'Convidar usuário', href: '/users' },
        ] : role === 'cliente' ? [
          { label: 'Ver pedidos', href: '/orders' },
          { label: 'Relatório', href: '/reports/weekly' },
        ] : undefined}
      />

      {isGestor && (
        <div className="mb-4">
          <Button onClick={() => openNewProject()}>
            <Plus size={16} /> Nova obra
          </Button>
        </div>
      )}

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
          title={search || statusFilter ? 'Nenhum resultado' : 'Nenhuma obra ainda'}
          description={
            search || statusFilter
              ? 'Ajuste os filtros ou tente outro termo.'
              : 'Crie a primeira obra e peça SKUs ao fornecedor.'
          }
          actionLabel={isGestor && !search && !statusFilter ? 'Nova obra' : undefined}
          onAction={isGestor && !search && !statusFilter ? () => openNewProject() : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(project => (
            <PanelCard
              key={project.id}
              panelId={`project-${project.id}`}
              title={project.name}
              defaultOpen={forceOpenId === project.id}
              summary={[
                project.progress_pct != null ? `${project.progress_pct.toFixed(0)}%` : null,
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
                { label: 'Pedir SKU desta obra', href: skuRequestCreateUrl({ projectId: project.id }) },
                { label: 'Novo orçamento', href: quoteCreateUrl(project.id) },
                ...(project.client_id ? [{ label: 'Convidar cliente', href: inviteUserUrl({ role: 'cliente', clientId: project.client_id }) }] : []),
                { label: 'Editar', onClick: () => { setEditing(project); setModalOpen(true) } },
                { label: 'Excluir', onClick: () => setDeleting(project), danger: true },
              ] : role === 'cliente' ? [
                { label: 'Ver pedidos', href: '/orders' },
                { label: 'Orçamentos', href: '/quotes' },
              ] : undefined}
            >
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                {project.client && <span className="flex items-center gap-1"><Building2 size={12} />{project.client.name}</span>}
                {project.location && <span className="flex items-center gap-1"><MapPin size={12} />{project.location}</span>}
              </div>

              <div className="mb-4">
                <ProjectProgressBar project={project} compact />
              </div>

              {isGestor && (
                <div className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
                  <label className="text-xs text-gray-500">
                    Progresso %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-1 block w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={progressDraft[project.id] ?? String(project.progress_pct ?? 0)}
                      onChange={e => setProgressDraft(prev => ({ ...prev, [project.id]: e.target.value }))}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    disabled={savingProgress === project.id}
                    onClick={() => saveProgress(project)}
                  >
                    {savingProgress === project.id ? 'Salvando…' : 'Salvar %'}
                  </Button>
                </div>
              )}
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setNewClientId(undefined) }} title={editing ? 'Editar obra' : 'Nova obra'} size="lg">
        <ProjectForm
          project={editing}
          defaultClientId={editing ? undefined : newClientId}
          onSuccess={() => { setModalOpen(false); setNewClientId(undefined); load() }}
          onCancel={() => { setModalOpen(false); setNewClientId(undefined) }}
        />
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
