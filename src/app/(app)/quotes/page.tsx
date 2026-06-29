'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Plus, Send, Check, X, ShoppingCart, Ban } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { QuoteLinesEditor } from '@/components/quotes/QuoteLinesEditor'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { Button } from '@/components/ui/Button'
import { PanelCard } from '@/components/ui/PanelCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { projectQuotesApi, projectsApi } from '@/lib/api'
import { useLiveRefresh } from '@/lib/hooks'
import { toast } from 'sonner'
import type { ProjectQuote, Project } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Aguardando cliente',
  approved: 'Aprovado pelo cliente',
  fulfilled: 'Pedidos gerados',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-violet-100 text-violet-800',
  approved: 'bg-emerald-100 text-emerald-700',
  fulfilled: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function QuotesPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} height="h-24" />}>
      <QuotesPageContent />
    </Suspense>
  )
}

function QuotesPageContent() {
  const { isGestor, role } = useAuth()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<ProjectQuote[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [editingQuote, setEditingQuote] = useState<ProjectQuote | null>(null)
  const [rejectQuote, setRejectQuote] = useState<ProjectQuote | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const defaultProjectId = searchParams.get('project_id') ?? undefined

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [q, p] = await Promise.all([
        projectQuotesApi.list(),
        isGestor ? projectsApi.list() : Promise.resolve([]),
      ])
      setQuotes(q)
      setProjects(p)
    } catch {
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }, [isGestor])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['projects'])

  useEffect(() => {
    if (searchParams.get('new') === '1' && isGestor) {
      setSelectedProjectId(defaultProjectId ?? '')
      setCreateOpen(true)
    }
  }, [searchParams, isGestor, defaultProjectId])

  async function handleCreate() {
    if (!selectedProjectId) {
      toast.error('Selecione a obra')
      return
    }
    setActing('create')
    try {
      const quote = await projectQuotesApi.create({ project_id: selectedProjectId })
      toast.success('Orçamento criado')
      setCreateOpen(false)
      setEditingQuote(quote)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar')
    } finally {
      setActing(null)
    }
  }

  async function handleSend(id: string) {
    setActing(id)
    try {
      await projectQuotesApi.send(id)
      toast.success('Orçamento enviado ao cliente')
      setEditingQuote(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally {
      setActing(null)
    }
  }

  async function handleDecide(quote: ProjectQuote, decision: 'approve' | 'reject') {
    setActing(quote.id)
    try {
      await projectQuotesApi.decide(quote.id, decision, decision === 'reject' ? rejectNote : null)
      toast.success(decision === 'approve' ? 'Orçamento aprovado' : 'Orçamento rejeitado')
      setRejectQuote(null)
      setRejectNote('')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setActing(null)
    }
  }

  async function handleFulfill(id: string) {
    setActing(id)
    try {
      const res = await projectQuotesApi.fulfill(id)
      toast.success(`${res.count} pedido(s) criado(s)`)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar pedidos')
    } finally {
      setActing(null)
    }
  }

  const pendingClient = quotes.filter(q => q.status === 'sent').length

  return (
    <div>
      <PageFeedHeader
        title={role === 'cliente' ? 'Meus orçamentos' : 'Orçamentos'}
        subtitle={
          isGestor
            ? `${quotes.length} orçamento(s) · ${pendingClient} aguardando cliente`
            : `${pendingClient} aguardando sua decisão`
        }
        menuItems={isGestor ? [{ label: 'Novo orçamento', onClick: () => setCreateOpen(true) }] : undefined}
      />

      {isGestor && (
        <p className="text-sm text-violet-900 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-4">
          Monte o orçamento com produtos <strong>aprovados</strong> da obra → envie ao cliente → após aprovação, gere os pedidos.
        </p>
      )}

      {role === 'cliente' && pendingClient > 0 && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          Você tem <strong>{pendingClient}</strong> orçamento(s) aguardando aprovação.
        </p>
      )}

      {isGestor && (
        <div className="mb-4">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Novo orçamento
          </Button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} height="h-24" />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={Receipt}
          iconClass="text-violet-600"
          title="Nenhum orçamento"
          description={
            isGestor
              ? 'Crie um orçamento vinculado à obra com produtos aprovados no catálogo.'
              : 'Quando a Estlar enviar um orçamento, ele aparecerá aqui.'
          }
          actionLabel={isGestor ? 'Novo orçamento' : undefined}
          onAction={isGestor ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {quotes.map(quote => (
            <PanelCard
              key={quote.id}
              panelId={`quote-${quote.id}`}
              title={quote.title}
              defaultOpen={quote.status === 'sent' && role === 'cliente'}
              summary={[
                quote.project?.name,
                `v${quote.version}`,
                fmt(Number(quote.total_price)),
                STATUS_LABEL[quote.status],
              ].filter(Boolean).join(' · ')}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[quote.status]}`}>
                  {STATUS_LABEL[quote.status]}
                </span>
              }
              menuItems={isGestor && quote.status === 'draft' ? [
                { label: 'Editar itens', onClick: () => setEditingQuote(quote) },
                { label: 'Enviar ao cliente', onClick: () => handleSend(quote.id) },
                { label: 'Cancelar', onClick: () => projectQuotesApi.update(quote.id, { status: 'cancelled' }).then(load) },
              ] : isGestor && quote.status === 'approved' ? [
                { label: 'Gerar pedidos', onClick: () => handleFulfill(quote.id) },
                { label: 'Ver pedidos', href: '/orders' },
              ] : isGestor && quote.status === 'fulfilled' ? [
                { label: 'Ver pedidos', href: '/orders' },
              ] : undefined}
            >
              {quote.notes && <p className="text-sm text-gray-600 mb-3">{quote.notes}</p>}

              {(quote.lines ?? []).length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden mb-3">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-3 py-2">Produto</th>
                        <th className="text-left px-3 py-2">Fornecedor</th>
                        <th className="text-right px-3 py-2">Qtd</th>
                        <th className="text-right px-3 py-2">Preço</th>
                        <th className="text-right px-3 py-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.lines!.map(line => (
                        <tr key={line.id} className="border-t border-gray-50">
                          <td className="px-3 py-2 font-medium">{line.product?.name}</td>
                          <td className="px-3 py-2 text-gray-500">{line.supplier?.name}</td>
                          <td className="px-3 py-2 text-right">{line.quantity}</td>
                          <td className="px-3 py-2 text-right">{fmt(line.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(line.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-violet-50/50">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-700">Total</td>
                        <td className="px-3 py-2 text-right font-bold text-violet-800">{fmt(Number(quote.total_price))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {quote.rejection_note && (
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-3">
                  Motivo da rejeição: {quote.rejection_note}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {isGestor && quote.status === 'draft' && (
                  <>
                    <Button variant="secondary" onClick={() => setEditingQuote(quote)}>Editar itens</Button>
                    <Button onClick={() => handleSend(quote.id)} loading={acting === quote.id}>
                      <Send size={14} /> Enviar ao cliente
                    </Button>
                  </>
                )}
                {role === 'cliente' && quote.status === 'sent' && (
                  <>
                    <Button onClick={() => handleDecide(quote, 'approve')} loading={acting === quote.id}>
                      <Check size={14} /> Aprovar orçamento
                    </Button>
                    <Button variant="secondary" onClick={() => setRejectQuote(quote)}>
                      <X size={14} /> Rejeitar
                    </Button>
                  </>
                )}
                {isGestor && quote.status === 'approved' && (
                  <Button onClick={() => handleFulfill(quote.id)} loading={acting === quote.id}>
                    <ShoppingCart size={14} /> Gerar pedidos
                  </Button>
                )}
                {isGestor && quote.status === 'fulfilled' && (
                  <Link href="/orders" className="text-sm text-indigo-700 font-medium self-center">
                    Pedidos gerados — ver lista →
                  </Link>
                )}
                {isGestor && quote.status === 'approved' && (
                  <Link href="/orders" className="text-sm text-violet-700 font-medium self-center">Ver pedidos →</Link>
                )}
              </div>
            </PanelCard>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo orçamento" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Obra *</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Selecione...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.client?.name ? ` — ${p.client.name}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={acting === 'create'}>Criar rascunho</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editingQuote}
        onClose={() => setEditingQuote(null)}
        title={editingQuote ? `Editar — ${editingQuote.title}` : 'Editar orçamento'}
        size="lg"
      >
        {editingQuote && (
          <QuoteLinesEditor
            quote={editingQuote}
            onSaved={q => { setEditingQuote(q); load() }}
          />
        )}
      </Modal>

      <Modal open={!!rejectQuote} onClose={() => setRejectQuote(null)} title="Rejeitar orçamento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Opcional: informe o motivo para a Estlar ajustar o orçamento.</p>
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
            placeholder="Motivo (opcional)"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectQuote(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => rejectQuote && handleDecide(rejectQuote, 'reject')}
              loading={acting === rejectQuote?.id}
            >
              <Ban size={14} /> Confirmar rejeição
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
