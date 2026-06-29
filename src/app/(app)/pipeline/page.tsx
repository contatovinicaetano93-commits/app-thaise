'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Kanban, Plus, Filter, Building2, Trophy, ShoppingCart, UserCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BriefingPanel } from '@/components/pipeline/BriefingPanel'
import { Input, Select } from '@/components/ui/Input'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { OpportunityForm } from '@/components/pipeline/OpportunityForm'
import { PipelineKanban } from '@/components/pipeline/PipelineKanban'
import { IntakeReviewPanel } from '@/components/pipeline/IntakeReviewPanel'
import { ActivityTimeline } from '@/components/ui/ActivityTimeline'
import { opportunitiesApi, clientsApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { formatBudget, STAGE_LABELS } from '@/lib/pipeline'
import { CONVERT_ELIGIBLE_STAGE, validateConvertReadiness } from '@/lib/pipeline/stage-gates'
import { orderCreateUrl, inviteUserUrl } from '@/lib/flow-links'
import { isSimpleMode } from '@/lib/app-mode'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'

export default function PipelinePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <PipelinePageContent />
    </Suspense>
  )
}

function PipelinePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const intakeFilter = searchParams.get('filter') === 'intake'
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | undefined>()
  const [converting, setConverting] = useState<Opportunity | undefined>()
  const [projectName, setProjectName] = useState('')
  const [lostTarget, setLostTarget] = useState<Opportunity | undefined>()
  const [lostReason, setLostReason] = useState('')
  const [convertSuccess, setConvertSuccess] = useState<{
    clientId: string
    projectId: string
    clientName: string
    email: string
    portalInvited?: boolean
  } | undefined>()
  const [convertLoading, setConvertLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [closedDeals, setClosedDeals] = useState<Opportunity[]>([])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [data, all] = await Promise.all([
        opportunitiesApi.list(),
        opportunitiesApi.list(true),
      ])
      setOpportunities(data)
      setClosedDeals(all.filter(o => o.stage === 'ganho' && o.project_id))
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
    const blockErr = validateConvertReadiness(converting)
    if (blockErr) {
      toast.error(blockErr)
      return
    }
    setConvertLoading(true)
    try {
      const result = await opportunitiesApi.convert(converting.id, projectName)
      toast.success('Obra Fechada convertida — Cliente e Empreendimento Fase A criados!')
      setConverting(undefined)
      load()
      setConvertSuccess({
        clientId: result.client.id,
        projectId: result.project.id,
        clientName: result.client.name,
        email: converting.email,
      })
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

  const intakeQueue = opportunities.filter(o =>
    (o.intake_status === 'pending' || o.intake_status === 'review') &&
    o.stage !== 'ganho' && o.stage !== 'perdido',
  )

  const visibleOpportunities = intakeFilter ? intakeQueue : opportunities

  async function handleInvitePortal() {
    if (!convertSuccess || convertSuccess.portalInvited) return
    setInviteLoading(true)
    try {
      const result = await clientsApi.invitePortal(convertSuccess.clientId)
      const sent = result.email?.sent
      const emailErr = result.email?.error
      if (sent) {
        toast.success(`Login criado e e-mail enviado para ${convertSuccess.email}`)
      } else if (emailErr) {
        toast.error(`Login criado, mas e-mail falhou: ${emailErr}`)
      } else {
        toast.success(
          `Login criado — e-mail não enviado. Senha: ${result.temporaryPassword} (mande no WhatsApp)`,
        )
      }
      setConvertSuccess(prev => prev ? { ...prev, portalInvited: true } : undefined)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao convidar cliente')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div>
      <PageFeedHeader
        icon={Kanban}
        title="Pipeline Comercial"
        subtitle={`${opportunities.length} oportunidade${opportunities.length !== 1 ? 's' : ''} ativa${opportunities.length !== 1 ? 's' : ''} · potencial ${formatBudget(totalBudget)}`}
        menuItems={[
          { label: 'Nova oportunidade', onClick: openCreate },
          { label: 'Ver empreendimentos', href: '/projects' },
        ]}
      />

      {!isSimpleMode() && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button onClick={openCreate}>
            <Plus size={16} /> Nova oportunidade
          </Button>
          <Button variant="secondary" onClick={() => router.push('/projects')}>
            <Building2 size={16} /> Empreendimentos
          </Button>
        </div>
      )}

      {!isSimpleMode() && (
      <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium flex items-center gap-1.5">
          <Trophy size={15} /> Fechar obra (criar empreendimento Fase A)
        </p>
        <p className="text-emerald-800/90 mt-1 text-xs leading-relaxed">
          Com oportunidade em <strong>Contrato & Fechamento</strong>, marque o sinal validado e use{' '}
          <strong>Fechar obra</strong> no card ou arraste para a coluna <strong>Ganho — Obra Fechada</strong>.
        </p>
      </div>
      )}

      {intakeQueue.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(intakeFilter ? '/pipeline' : '/pipeline?filter=intake')}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
              intakeFilter
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-gray-200 text-gray-600 hover:border-amber-200'
            }`}
          >
            <Filter size={14} />
            Intake para revisar ({intakeQueue.length})
          </button>
          {intakeFilter && (
            <button
              type="button"
              onClick={() => router.push('/pipeline')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Ver funil completo
            </button>
          )}
        </div>
      )}

      {intakeFilter && intakeQueue.length === 0 && !loading && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Nenhum lead aguardando revisão de intake.
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : visibleOpportunities.length === 0 ? (
        <EmptyState
          icon={Plus}
          iconClass="text-violet-600"
          title={intakeFilter ? 'Fila de intake vazia' : 'Nenhuma oportunidade no funil'}
          description={intakeFilter ? 'Todos os leads foram revisados.' : 'Cadastre investidores em prospecção antes de virarem clientes e empreendimentos.'}
          actionLabel={intakeFilter ? undefined : 'Nova oportunidade'}
          onAction={intakeFilter ? undefined : openCreate}
        />
      ) : intakeFilter ? (
        <div className="space-y-3">
          {intakeQueue.map(opp => (
            <div key={opp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{opp.name}</p>
                  <p className="text-xs text-gray-500">{opp.email} · {opp.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(opp)}
                  className="text-xs text-violet-600 hover:underline"
                >
                  Abrir ficha completa
                </button>
              </div>
              <IntakeReviewPanel opportunity={opp} onReviewed={load} />
            </div>
          ))}
        </div>
      ) : (
        <PipelineKanban
          opportunities={visibleOpportunities}
          onRefresh={load}
          onEdit={openEdit}
          onMarkLost={setLostTarget}
          onRequestConvert={openConvert}
        />
      )}

      {!intakeFilter && closedDeals.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-emerald-600" />
            Obras fechadas ({closedDeals.length})
          </h3>
          <div className="space-y-2">
            {closedDeals.slice(0, 8).map(opp => (
              <div
                key={opp.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900">{opp.name}</p>
                  <p className="text-xs text-gray-500">{opp.company ?? opp.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opp.project_id && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/projects?open=${opp.project_id}`)}
                    >
                      <Building2 size={14} /> Abrir empreendimento
                    </Button>
                  )}
                  {opp.project_id && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(orderCreateUrl({
                        projectId: opp.project_id!,
                        clientId: opp.client_id ?? undefined,
                      }))}
                    >
                      <ShoppingCart size={14} /> Criar pedido
                    </Button>
                  )}
                  {opp.client_id && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push(inviteUserUrl({ role: 'cliente', clientId: opp.client_id! }))}
                    >
                      Convidar cliente
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar oportunidade' : 'Nova oportunidade'}>
        <OpportunityForm
          opportunity={editing}
          onSuccess={() => { setModalOpen(false); load() }}
          onCancel={() => setModalOpen(false)}
        />
        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <IntakeReviewPanel opportunity={editing} onReviewed={() => { load(); setModalOpen(false) }} />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Modelo de cobrança"
                value={editing.fee_model ?? ''}
                onChange={async e => {
                  const fee_model = e.target.value as Opportunity['fee_model']
                  await opportunitiesApi.update(editing.id, { fee_model: fee_model || null })
                  load()
                }}
                options={[
                  { value: '', label: '—' },
                  { value: 'fixo', label: 'Fee fixo' },
                  { value: 'variavel', label: 'Performance / VGV' },
                  { value: 'hibrido', label: 'Híbrido' },
                ]}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
                <input
                  type="checkbox"
                  checked={editing.signal_paid ?? false}
                  onChange={async e => {
                    await opportunitiesApi.update(editing.id, { signal_paid: e.target.checked })
                    load()
                  }}
                />
                Sinal financeiro validado
              </label>
            </div>
            <BriefingPanel opportunity={editing} onSaved={load} />
            {!validateConvertReadiness(editing) && editing.stage === CONVERT_ELIGIBLE_STAGE && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm text-emerald-900 mb-3">
                  Pronta para fechar — cria cliente + empreendimento Fase A.
                </p>
                <Button onClick={() => { setModalOpen(false); openConvert(editing) }}>
                  <Trophy size={16} /> Fechar obra e criar empreendimento
                </Button>
              </div>
            )}
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
        {converting && (() => {
          const convertBlock = validateConvertReadiness(converting)
          return (
          <>
            {convertBlock && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                ⚠️ {convertBlock}
                {converting.stage !== CONVERT_ELIGIBLE_STAGE && (
                  <>
                    {' '}Estágio atual: {STAGE_LABELS[converting.stage]}.
                  </>
                )}
                {' '}Edite a oportunidade ou{' '}
                <button
                  type="button"
                  className="underline font-medium"
                  onClick={() => { setConverting(undefined); openEdit(converting) }}
                >
                  abra o formulário
                </button>.
              </div>
            )}
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
                <Trophy size={16} /> Confirmar fechamento
              </Button>
            </div>
          </>
          )
        })()}
      </Modal>

      <Modal
        open={!!convertSuccess}
        onClose={() => setConvertSuccess(undefined)}
        title="Obra Fechada — próximos passos"
        size="sm"
      >
        {convertSuccess && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{convertSuccess.clientName}</strong> virou cliente oficial. Empreendimento Fase A criado com Welcome Kit.
            </p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside mb-5">
              <li>Convide o cliente ao portal (e-mail automático)</li>
              <li>Complete o checklist da Fase A</li>
              <li>Homologue fornecedores e crie pedidos</li>
            </ol>
            <div className="flex flex-col gap-2">
              {convertSuccess.portalInvited ? (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  Login do portal criado. Use os botões abaixo para continuar ou feche este painel.
                </p>
              ) : (
                <Button onClick={handleInvitePortal} loading={inviteLoading}>
                  Criar login e enviar e-mail
                </Button>
              )}
              <Button variant="secondary" onClick={() => {
                router.push(`/users?role=cliente&client_id=${convertSuccess.clientId}`)
                setConvertSuccess(undefined)
              }}>
                Configurar login manualmente
              </Button>
              <Button onClick={() => {
                router.push(`/projects?open=${convertSuccess.projectId}`)
                setConvertSuccess(undefined)
              }}>
                <Building2 size={16} /> Abrir empreendimento Fase A
              </Button>
              <Button variant="secondary" onClick={() => {
                router.push(orderCreateUrl({
                  projectId: convertSuccess.projectId,
                  clientId: convertSuccess.clientId,
                }))
                setConvertSuccess(undefined)
              }}>
                <ShoppingCart size={16} /> Criar pedido desta obra
              </Button>
              <Button variant="secondary" onClick={() => {
                router.push('/pending-suppliers')
                setConvertSuccess(undefined)
              }}>
                <UserCheck size={16} /> Homologar fornecedor
              </Button>
              <Button variant="secondary" onClick={() => setConvertSuccess(undefined)}>
                Continuar no pipeline
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
