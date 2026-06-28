'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileBarChart, CheckCircle, Send } from 'lucide-react'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { useAuth } from '@/components/auth/AuthProvider'
import { estlarApi } from '@/lib/api'
import { toast } from 'sonner'
import type { WeeklyReport } from '@/types/database'

export default function WeeklyReportsPage() {
  const router = useRouter()
  const { isGestor, role, loading: authLoading } = useAuth()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && role === 'fornecedor') {
      router.replace('/dashboard')
    }
  }, [authLoading, role, router])

  async function load() {
    setLoading(true)
    try {
      setReports(await estlarApi.listWeeklyReports())
    } catch {
      toast.error('Erro ao carregar relatórios 360')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || role === 'fornecedor') return
    load()
  }, [authLoading, role])

  async function updateStatus(id: string, status: 'approved' | 'sent') {
    setActionId(id)
    try {
      await estlarApi.updateWeeklyReport(id, status)
      toast.success(status === 'sent' ? 'Relatório enviado ao cliente' : 'Relatório aprovado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setActionId(null)
    }
  }

  if (authLoading || role === 'fornecedor') {
    return <ListSkeleton rows={3} />
  }

  const drafts = reports.filter(r => r.status === 'draft')
  const approved = reports.filter(r => r.status === 'approved')
  const sent = reports.filter(r => r.status === 'sent')

  return (
    <div>
      <PageFeedHeader
        icon={FileBarChart}
        title="Relatório 360 Semanal"
        subtitle={
          isGestor
            ? 'Rascunhos gerados automaticamente às sextas — revise e envie ao cliente'
            : 'Atualizações semanais do seu empreendimento, enviadas pela equipe Estlar'
        }
        menuItems={[{ label: 'Atualizar', onClick: load }]}
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          iconClass="text-violet-600"
          title={isGestor ? 'Nenhum relatório 360 ainda' : 'Nenhum relatório disponível'}
          description={
            isGestor
              ? 'Os rascunhos são gerados automaticamente toda sexta-feira para empreendimentos ativos.'
              : 'Quando a equipe enviar uma atualização semanal, ela aparecerá aqui.'
          }
        />
      ) : isGestor ? (
        <div className="space-y-6">
          {drafts.length > 0 && (
            <ReportSection
              title="Rascunhos para revisão"
              reports={drafts}
              actionId={actionId}
              onApprove={id => updateStatus(id, 'approved')}
              onSend={id => updateStatus(id, 'sent')}
            />
          )}
          {approved.length > 0 && (
            <ReportSection
              title="Aprovados — prontos para envio"
              reports={approved}
              actionId={actionId}
              onSend={id => updateStatus(id, 'sent')}
            />
          )}
          {sent.length > 0 && <ReportSection title="Enviados" reports={sent} readOnly />}
        </div>
      ) : (
        <ReportSection title="Suas atualizações" reports={sent} readOnly />
      )}
    </div>
  )
}

function ReportSection({
  title,
  reports,
  actionId,
  onApprove,
  onSend,
  readOnly,
}: {
  title: string
  reports: WeeklyReport[]
  actionId?: string | null
  onApprove?: (id: string) => void
  onSend?: (id: string) => void
  readOnly?: boolean
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title} ({reports.length})</h2>
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{r.week_label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cronograma {r.schedule_pct ?? 0}% · {r.budget_status}
                </p>
              </div>
              {!readOnly && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'sent' ? 'bg-emerald-100 text-emerald-700'
                  : r.status === 'approved' ? 'bg-violet-100 text-violet-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.status === 'sent' ? 'Enviado' : r.status === 'approved' ? 'Aprovado' : 'Rascunho'}
                </span>
              )}
            </div>

            {r.completed && (r.completed as string[]).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Concluído</p>
                <ul className="text-sm text-gray-700 space-y-0.5">
                  {(r.completed as string[]).map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}

            {r.next_steps && (r.next_steps as string[]).length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Próximos passos</p>
                <ul className="text-sm text-gray-700 space-y-0.5">
                  {(r.next_steps as string[]).map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}

            {r.risks && (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">{r.risks}</p>
            )}

            {!readOnly && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {onApprove && r.status === 'draft' && (
                  <Button variant="secondary" loading={actionId === r.id} onClick={() => onApprove(r.id)}>
                    <CheckCircle size={14} className="mr-1" /> Aprovar
                  </Button>
                )}
                {onSend && r.status !== 'sent' && (
                  <Button loading={actionId === r.id} onClick={() => onSend(r.id)}>
                    <Send size={14} className="mr-1" /> Enviar ao cliente
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
