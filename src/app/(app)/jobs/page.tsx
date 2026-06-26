'use client'

import { useEffect, useState } from 'react'
import { Server } from 'lucide-react'
import { jobsApi, type JobLogRow } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import type { PanelPriority } from '@/lib/use-panel-state'
import { toast } from 'sonner'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    jobsApi.list().then(setJobs).catch(() => toast.error('Erro ao carregar jobs')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function retry(id: string) {
    setRetrying(id)
    try {
      await jobsApi.retry(id)
      toast.success('Job reprocessado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao reprocessar')
    } finally {
      setRetrying(null)
    }
  }

  const counts = {
    failed: jobs.filter(j => j.status === 'failed').length,
    pending: jobs.filter(j => j.status === 'pending').length,
  }

  const panels = jobs.map(job => ({
    id: `job-${job.id}`,
    priority: (job.status === 'failed' ? 'primary' : 'secondary') as PanelPriority,
  }))

  return (
    <div className="space-y-3">
      <PageFeedHeader
        title="Fila de Jobs"
        icon={Server}
        subtitle={`${counts.failed} falho(s) · ${counts.pending} pendente(s) — memória em job_logs`}
        menuItems={[{ label: 'Atualizar lista', onClick: load }]}
      />

      {panels.length > 0 && <PanelToolbar sections={panels} />}

      {loading ? (
        <ListSkeleton rows={5} height="h-14" />
      ) : jobs.length === 0 ? (
        <PanelCard
          panelId="jobs-empty"
          title="Nenhum job registrado"
          icon={Server}
          collapsible={false}
          summary="Aprove ou entregue um pedido para gerar eventos"
        >
          <p className="text-sm text-gray-400 text-center">
            Aprove ou entregue um pedido para gerar eventos.
          </p>
        </PanelCard>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <PanelCard
              key={job.id}
              panelId={`job-${job.id}`}
              title={job.job_type}
              defaultOpen={false}
              summary={`${STATUS_LABEL[job.status] ?? job.status} · ${new Date(job.created_at).toLocaleString('pt-BR')}`}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[job.status]}`}>
                  {job.status}
                </span>
              }
              menuItems={job.status === 'failed' ? [
                { label: 'Reprocessar', onClick: () => retry(job.id), disabled: retrying === job.id },
              ] : [{ label: 'Atualizar lista', onClick: load }]}
            >
              <p className="text-xs text-gray-400 truncate font-mono">
                {JSON.stringify(job.payload)}
              </p>
              {job.error && <p className="text-xs text-red-600 mt-1">{job.error}</p>}
              <p className="text-xs text-gray-300 mt-1">{new Date(job.created_at).toLocaleString('pt-BR')}</p>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  )
}
