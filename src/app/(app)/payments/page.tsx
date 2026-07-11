'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Wallet, ShieldCheck, Lock, Unlock } from 'lucide-react'
import { paymentsApi } from '@/lib/api'
import { useAuth } from '@/components/auth/AuthProvider'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { EmptyState, ListSkeleton } from '@/components/ui/EmptyState'
import { PanelCard } from '@/components/ui/PanelCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLiveRefresh } from '@/lib/hooks'
import { toast } from 'sonner'
import type { OrderPayment } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  held: 'Em escrow',
  released: 'Liberado',
  blocked: 'Bloqueado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  held: 'bg-amber-100 text-amber-800',
  released: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PaymentsPage() {
  const { isGestor, role } = useAuth()
  const [payments, setPayments] = useState<OrderPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('held')
  const [releasing, setReleasing] = useState<OrderPayment | null>(null)
  const [pixRef, setPixRef] = useState('')
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [releaseInfo, setReleaseInfo] = useState<{
    can_release: boolean
    block_reason?: string
    eligible_audit?: { itemLabel: string; audit: { score: number; status: string } }
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await paymentsApi.list(filter ? { status: filter } : undefined)
      setPayments(data)
    } catch {
      toast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])
  useLiveRefresh(load, ['orders'])

  async function openRelease(payment: OrderPayment) {
    setReleasing(payment)
    setPixRef('')
    setNotes('')
    setReleaseInfo(null)
    try {
      const info = await paymentsApi.get(payment.id)
      setReleaseInfo({
        can_release: info.can_release,
        block_reason: info.block_reason,
        eligible_audit: info.eligible_audit
          ? { itemLabel: info.eligible_audit.itemLabel, audit: info.eligible_audit.audit }
          : undefined,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao verificar elegibilidade')
    }
  }

  async function handleRelease() {
    if (!releasing) return
    setActing(true)
    try {
      await paymentsApi.release(releasing.id, {
        pix_reference: pixRef.trim() || null,
        release_notes: notes.trim() || null,
      })
      toast.success('Pagamento liberado ao fornecedor')
      setReleasing(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao liberar')
    } finally {
      setActing(false)
    }
  }

  const heldCount = payments.filter(p => p.status === 'held').length

  return (
    <div>
      <PageFeedHeader
        title={role === 'fornecedor' ? 'Meus recebimentos' : 'Pagamentos'}
        subtitle={
          isGestor
            ? `${payments.length} registro(s) · liberação condicionada à auditoria visual`
            : 'Valores retidos até a Estlar validar a entrega'
        }
      />

      {isGestor && (
        <p className="text-sm text-violet-900 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-4">
          Pedidos <strong>entregues</strong> geram pagamento em escrow. Só libere após evidência
          <strong> aprovada</strong> no checklist da obra (fases D/E/F).
        </p>
      )}

      {isGestor && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['held', 'released', ''].map(s => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                filter === s
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-200'
              }`}
            >
              {s === 'held' ? `Em escrow (${heldCount})` : s === 'released' ? 'Liberados' : 'Todos'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={4} height="h-20" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          iconClass="text-violet-600"
          title="Nenhum pagamento"
          description={
            isGestor
              ? 'Pagamentos em escrow aparecem quando um pedido é marcado como entregue.'
              : 'Quando a Estlar liberar um pagamento após auditoria, ele aparecerá aqui.'
          }
        />
      ) : (
        <div className="space-y-2">
          {payments.map(payment => (
            <PanelCard
              key={payment.id}
              panelId={`payment-${payment.id}`}
              title={payment.order?.supplier?.name ?? 'Fornecedor'}
              summary={[
                payment.order?.product?.name,
                fmt(Number(payment.amount)),
                STATUS_LABEL[payment.status],
                payment.order?.project?.name,
              ].filter(Boolean).join(' · ')}
              headerExtra={
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[payment.status]}`}>
                  {STATUS_LABEL[payment.status]}
                </span>
              }
              menuItems={
                isGestor && payment.status === 'held'
                  ? [{ label: 'Liberar pagamento', onClick: () => openRelease(payment) }]
                  : undefined
              }
            >
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Pedido: {payment.order?.client?.name ?? '—'} · {payment.order?.product?.name}
                </p>
                {payment.audit_status && (
                  <p className="flex items-center gap-1.5 text-violet-800">
                    <ShieldCheck size={14} />
                    Auditoria vinculada: {payment.audit_status}
                    {payment.audit_score != null && ` · score ${payment.audit_score}/10`}
                  </p>
                )}
                {payment.status === 'held' && !payment.audit_status && (
                  <p className="flex items-center gap-1.5 text-amber-800">
                    <Lock size={14} />
                    Aguardando evidência aprovada no checklist da obra
                  </p>
                )}
                {payment.status === 'released' && payment.released_at && (
                  <p className="flex items-center gap-1.5 text-emerald-700">
                    <Unlock size={14} />
                    Liberado em {new Date(payment.released_at).toLocaleDateString('pt-BR')}
                    {payment.pix_reference && ` · Pix: ${payment.pix_reference}`}
                  </p>
                )}
                {isGestor && payment.status === 'held' && payment.order?.project?.id && (
                  <Link
                    href={`/projects`}
                    className="text-xs text-violet-700 font-medium inline-block"
                  >
                    Ir para obras → auditar checklist →
                  </Link>
                )}
              </div>
              {isGestor && payment.status === 'held' && (
                <div className="mt-3">
                  <Button variant="secondary" onClick={() => openRelease(payment)}>
                    <Unlock size={14} /> Liberar pagamento
                  </Button>
                </div>
              )}
            </PanelCard>
          ))}
        </div>
      )}

      <Modal
        open={!!releasing}
        onClose={() => setReleasing(null)}
        title="Liberar pagamento"
        size="md"
      >
        {releasing && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              <strong>{releasing.order?.supplier?.name}</strong> · {fmt(Number(releasing.amount))}
            </p>

            {releaseInfo?.eligible_audit && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-900">
                <p className="font-medium">Auditoria elegível</p>
                <p className="text-xs mt-1">
                  {releaseInfo.eligible_audit.itemLabel} · {releaseInfo.eligible_audit.audit.status} · score {releaseInfo.eligible_audit.audit.score}/10
                </p>
              </div>
            )}

            {releaseInfo && !releaseInfo.can_release && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-900">
                {releaseInfo.block_reason ?? 'Auditoria não aprovada — liberação bloqueada.'}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Referência Pix (opcional)</label>
              <input
                value={pixRef}
                onChange={e => setPixRef(e.target.value)}
                placeholder="ID da transferência, comprovante..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                disabled={!releaseInfo?.can_release}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Notas</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]"
                disabled={!releaseInfo?.can_release}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setReleasing(null)}>Cancelar</Button>
              <Button
                onClick={handleRelease}
                loading={acting}
                disabled={!releaseInfo?.can_release}
              >
                Confirmar liberação
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
