'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Building2, Pencil, Trash2, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PhaseStepper } from '@/components/ui/PhaseStepper'
import { QcpsBar } from '@/components/ui/QcpsBar'
import { Button } from '@/components/ui/Button'
import { projectsApi } from '@/lib/api'
import { useDebounce } from '@/lib/hooks'
import { toast } from 'sonner'
import type { Project } from '@/types/database'

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
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>()
  const [deleting, setDeleting] = useState<Project | undefined>()
  const [advancing, setAdvancing] = useState<string | null>(null)
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

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (p.location ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (p.client?.name ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empreendimentos</h2>
          <p className="text-gray-500 mt-1 text-sm">Jornada A → F com avaliação QCPS</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}>
          <Plus size={16} />Novo
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, local ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 size={20} className="text-violet-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {search ? 'Nenhum resultado' : 'Nenhum empreendimento ainda'}
          </h3>
          <p className="text-sm text-gray-500">
            {search ? 'Tente outro termo.' : 'Crie o primeiro e acompanhe as fases A até F.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(project => (
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
                    {project.client && (
                      <span className="flex items-center gap-1"><Building2 size={12} />{project.client.name}</span>
                    )}
                    {project.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} />{project.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(project); setModalOpen(true) }} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleting(project)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <PhaseStepper
                current={project.phase}
                onAdvance={() => handleAdvance(project.id)}
                advancing={advancing === project.id}
              />

              <div className="mt-4 pt-4 border-t border-gray-50">
                <QcpsBar scores={project} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Empreendimento' : 'Novo Empreendimento'} size="lg">
        <ProjectForm
          project={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
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
