'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Server } from 'lucide-react'
import { jobsApi, type JobLogRow } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server size={22} className="text-violet-600" />
            Fila de Jobs
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {counts.failed} falho(s) · {counts.pending} pendente(s) — memória em job_logs
          </p>
        </div>
        <Button variant="secondary" onClick={load}><RefreshCw size={16} />Atualizar</Button>
      </div>

      {loading ? (
        <ListSkeleton rows={5} height="h-20" />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-400 text-sm">
          Nenhum job registrado. Aprove ou entregue um pedido para gerar eventos.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-500">{job.job_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[job.status]}`}>{job.status}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {JSON.stringify(job.payload)}
                </p>
                {job.error && <p className="text-xs text-red-600 mt-1">{job.error}</p>}
                <p className="text-xs text-gray-300 mt-1">{new Date(job.created_at).toLocaleString('pt-BR')}</p>
              </div>
              {job.status === 'failed' && (
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => retry(job.id)} disabled={retrying === job.id}>
                  Reprocessar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
