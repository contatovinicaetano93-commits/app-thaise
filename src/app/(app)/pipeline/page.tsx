'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Kanban, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { OpportunityForm } from '@/components/pipeline/OpportunityForm'
import { PipelineKanban } from '@/components/pipeline/PipelineKanban'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { opportunitiesApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { formatBudget } from '@/lib/pipeline'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'

export default function PipelinePage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | undefined>()
  const [converting, setConverting] = useState<Opportunity | undefined>()
  const [projectName, setProjectName] = useState('')
  const [lostTarget, setLostTarget] = useState<Opportunity | undefined>()
  const [lostReason, setLostReason] = useState('')
  const [convertLoading, setConvertLoading] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await opportunitiesApi.list()
      setOpportunities(data)
    } catch {
      if (!silent) toast.error('Erro ao carregar pipeline')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['opportunities'])

  function openCreate() {
    setEditing(undefined)
    setModalOpen(true)
  }

  function openEdit(opp: Opportunity) {
    setEditing(opp)
    setModalOpen(true)
  }

  function openConvert(opp: Opportunity) {
    setConverting(opp)
    setProjectName(`Obra Fechada — ${opp.company || opp.name}`)
  }

  async function handleConvert() {
    if (!converting) return
    setConvertLoading(true)
    try {
      const result = await opportunitiesApi.convert(converting.id, projectName)
      toast.success('Obra Fechada convertida — Cliente e Empreendimento Fase A criados!')
      setConverting(undefined)
      load()
      router.push(`/projects`)
      void result
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na conversão')
    } finally {
      setConvertLoading(false)
    }
  }

  async function handleMarkLost() {
    if (!lostTarget) return
    try {
      await opportunitiesApi.moveStage(lostTarget.id, 'perdido', lostReason || undefined)
      toast.success('Oportunidade marcada como perdida')
      setLostTarget(undefined)
      setLostReason('')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
    }
  }

  const totalBudget = opportunities.reduce((sum, o) => sum + (o.budget_estimate ?? 0), 0)

  return (
    <div>
      <PageFeedHeader
        icon={Kanban}
        title="Pipeline Comercial"
        subtitle={`${opportunities.length} oportunidade${opportunities.length !== 1 ? 's' : ''} ativa${opportunities.length !== 1 ? 's' : ''} · potencial ${formatBudget(totalBudget)}`}
        menuItems={[{ label: 'Nova oportunidade', onClick: openCreate }]}
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Plus}
          iconClass="text-violet-600"
          title="Nenhuma oportunidade no funil"
          description="Cadastre investidores em prospecção antes de virarem clientes e empreendimentos."
          actionLabel="Nova oportunidade"
          onAction={openCreate}
        />
      ) : (
        <PipelineKanban
          opportunities={opportunities}
          onRefresh={load}
          onEdit={openEdit}
          onMarkLost={setLostTarget}
          onRequestConvert={openConvert}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar oportunidade' : 'Nova oportunidade'}>
        <OpportunityForm
          opportunity={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <ActivityTimeline entityType="opportunity" entityId={editing.id} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!converting}
        onClose={() => setConverting(undefined)}
        title="Fechar Obra Fechada"
        size="sm"
      >
        {converting && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{converting.name}</strong> será convertido em cliente oficial e um empreendimento
              na <strong>Fase A</strong> será aberto para execução via fornecedores terceirizados curados.
            </p>
            <Input
              label="Nome do empreendimento"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="secondary" onClick={() => setConverting(undefined)}>Cancelar</Button>
              <Button onClick={handleConvert} loading={convertLoading}>
                Confirmar fechamento
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!lostTarget} onClose={() => setLostTarget(undefined)} title="Marcar como perdido" size="sm">
        {lostTarget && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Arquivar <strong>{lostTarget.name}</strong> fora do funil ativo?
            </p>
            <Input
              label="Motivo (opcional)"
              placeholder="Preço, timing, concorrente..."
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="secondary" onClick={() => setLostTarget(undefined)}>Cancelar</Button>
              <Button variant="danger" onClick={handleMarkLost}>Confirmar</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
