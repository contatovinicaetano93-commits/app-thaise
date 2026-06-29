'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, Truck, Users, ShoppingCart, Package, Clock,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { dashboardApi, type DashboardStats, nextStepApi } from '@/lib/api'
import { formatRelativeDate } from '@/lib/format'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { AlertsBanner } from '@/components/ui/AlertsBanner'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { FirstProjectWizard } from '@/components/projects/FirstProjectWizard'
import { MonthlyReportPanel } from '@/components/reports/MonthlyReportPanel'
import { useAuth } from '@/components/auth/AuthProvider'
import { IncompleteProfileBanner } from '@/components/auth/IncompleteProfileBanner'
import { RoleScopeBanner } from '@/components/auth/RoleScopeBanner'
import { useMonthlyReport } from '@/lib/hooks/use-monthly-report'
import { useLiveRefresh } from '@/lib/hooks'
import { isSimpleMode, dashboardPanelVisible } from '@/lib/app-mode'
import type { UserRole } from '@/lib/auth/roles'
import { toast } from 'sonner'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovado', processing: 'Em produção',
  delivered: 'Entregue', cancelled: 'Cancelado',
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const DASHBOARD_PANELS = [
  { id: 'monthly-report', priority: 'primary' as const },
  { id: 'next-step', priority: 'primary' as const },
  { id: 'catalog-intake', priority: 'primary' as const },
  { id: 'kpi-revenue', priority: 'primary' as const },
  { id: 'kpi-suppliers', priority: 'primary' as const },
  { id: 'kpi-clients', priority: 'primary' as const },
  { id: 'kpi-orders', priority: 'primary' as const },
  { id: 'chart-revenue', priority: 'secondary' as const },
  { id: 'chart-orders', priority: 'secondary' as const },
  { id: 'recent-orders', priority: 'primary' as const },
  { id: 'top-suppliers', priority: 'secondary' as const },
]

function panelVisible(
  panelId: string,
  opts: { isGestor: boolean; role: UserRole | null; hasNextStep: boolean },
): boolean {
  if (!dashboardPanelVisible(panelId, opts.role, opts.isGestor)) return false
  if (panelId === 'next-step') return opts.hasNextStep
  if (panelId === 'catalog-intake') return opts.isGestor
  if (panelId === 'monthly-report') return opts.isGestor
  if (!opts.isGestor) {
    if (['kpi-suppliers', 'kpi-clients', 'chart-revenue', 'chart-orders', 'top-suppliers', 'catalog-intake'].includes(panelId)) {
      return false
    }
  }
  if (opts.role === 'cliente' && panelId === 'kpi-revenue') return false
  return true
}

function StatBody({ value, sub, icon: Icon, iconBg, iconColor }: {
  value: string; sub: string; icon: React.ElementType; iconBg: string; iconColor: string
}) {
  return (
    <>
      <div className={`p-2.5 rounded-xl ${iconBg} w-fit mb-3`}>
        <Icon size={18} className={iconColor} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </>
  )
}

export default function DashboardPage() {
  const { isGestor, role } = useAuth()
  const monthly = useMonthlyReport({ autoFetch: false })
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [nextStep, setNextStep] = useState<{ label: string; href: string; reason: string } | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [dash, stepRes] = await Promise.all([
        dashboardApi.get(),
        nextStepApi.get(),
      ])
      setData(dash)
      setNextStep(stepRes.next)
      if (isGestor) monthly.refresh().catch(() => {})
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Erro ao carregar dashboard')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [isGestor, monthly.refresh])

  useEffect(() => { refresh() }, [refresh])
  useLiveRefresh(refresh, ['clients', 'products', 'orders', 'suppliers', 'projects'])

  useEffect(() => {
    if (!loading && isGestor && !isSimpleMode() && data?.counts.projects === 0) {
      const dismissed = sessionStorage.getItem('wizard-dismissed')
      if (!dismissed) setShowWizard(true)
    }
  }, [loading, isGestor, data?.counts.projects])

  const c = data?.counts
  const catalog = data?.catalogIntake
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white rounded-2xl border animate-pulse" />)}
        <ListSkeleton rows={2} height="h-48" />
      </div>
    )
  }

  const panels = DASHBOARD_PANELS.filter(p =>
    panelVisible(p.id, { isGestor, role, hasNextStep: Boolean(nextStep) }),
  )

  return (
    <div className="space-y-3 animate-fade-in">
      <FirstProjectWizard
        open={showWizard}
        onClose={() => {
          sessionStorage.setItem('wizard-dismissed', '1')
          setShowWizard(false)
        }}
      />
      <AlertsBanner />
      <IncompleteProfileBanner />
      <RoleScopeBanner />

      <PageFeedHeader
        title="Visão Geral"
        subtitle={<span className="capitalize">{monthLabel}</span>}
        menuItems={isGestor ? [
          { label: 'Obras', href: '/projects' },
          { label: 'Orçamentos', href: '/quotes' },
          { label: 'Convidar usuário', href: '/users' },
        ] : role === 'fornecedor' ? [
          { label: 'Meu catálogo', href: '/products' },
          { label: 'Meus pedidos', href: '/orders' },
        ] : [
          { label: 'Minha obra', href: '/projects' },
          { label: 'Relatório 360', href: '/reports/weekly' },
        ]}
      />

      <PanelToolbar sections={panels} className="mb-1" />

      {isGestor && !isSimpleMode() && (
        <MonthlyReportPanel
          data={monthly.data}
          loading={monthly.loading}
          error={monthly.error}
          onRetry={monthly.refresh}
          compact
        />
      )}

      {nextStep && (
        <PanelCard
          panelId="next-step"
          title="Próximo passo no fluxo"
          className="bg-violet-50 border-violet-100"
          summary={nextStep.label}
          href={nextStep.href}
          menuItems={[{ label: 'Ir para ação', href: nextStep.href }]}
        >
          <p className="font-semibold text-gray-900">{nextStep.label}</p>
          <p className="text-sm text-gray-500 mt-1">{nextStep.reason}</p>
        </PanelCard>
      )}

      {isGestor && catalog && (
        <PanelCard
          panelId="catalog-intake"
          title="Inputs no catálogo curado"
          icon={Package}
          iconClassName="text-amber-600"
          href="/products"
          summary={
            catalog.newThisWeek > 0
              ? `${catalog.newThisWeek} novo(s) · ${catalog.suppliersThisWeek} fornecedor(es) esta semana`
              : `${catalog.totalInCatalog} produto(s) · ${catalog.totalSuppliersInCatalog} fornecedor(es) homologado(s)`
          }
          menuItems={[{ label: 'Ver catálogo curado', href: '/products' }]}
          className={catalog.newThisWeek > 0 ? 'border-amber-100 bg-amber-50/40' : undefined}
        >
          {catalog.newThisWeek > 0 ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {catalog.newThisWeek} produto{catalog.newThisWeek !== 1 ? 's' : ''} novo{catalog.newThisWeek !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                de <strong>{catalog.suppliersThisWeek}</strong> fornecedor{catalog.suppliersThisWeek !== 1 ? 'es' : ''} homologado{catalog.suppliersThisWeek !== 1 ? 's' : ''} nos últimos 7 dias
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Catálogo total: {catalog.totalInCatalog} produto{catalog.totalInCatalog !== 1 ? 's' : ''} de {catalog.totalSuppliersInCatalog} fornecedor{catalog.totalSuppliersInCatalog !== 1 ? 'es' : ''}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Nenhum input novo nos últimos 7 dias.
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {catalog.totalInCatalog} produto{catalog.totalInCatalog !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                de {catalog.totalSuppliersInCatalog} fornecedor{catalog.totalSuppliersInCatalog !== 1 ? 'es' : ''} homologado{catalog.totalSuppliersInCatalog !== 1 ? 's' : ''} no catálogo curado
              </p>
            </>
          )}
        </PanelCard>
      )}

      {panelVisible('kpi-revenue', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="kpi-revenue"
          title="Receita no mês"
          icon={TrendingUp}
          iconClassName="text-violet-600"
          summary={`${fmt(c?.monthRevenue ?? 0)} · ${c?.monthOrders ?? 0} pedido(s)`}
          href="/orders"
          menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}
        >
          <StatBody
            value={fmt(c?.monthRevenue ?? 0)}
            sub={`${c?.monthOrders ?? 0} pedido(s) este mês`}
            icon={TrendingUp} iconBg="bg-violet-100" iconColor="text-violet-600"
          />
        </PanelCard>
      )}

      {panelVisible('kpi-suppliers', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="kpi-suppliers"
          title="Fornecedores"
          icon={Truck}
          iconClassName="text-indigo-600"
          summary={`${c?.suppliers ?? 0} total · ${c?.activeSuppliers ?? 0} ativos`}
          badge={c?.pendingSuppliers ? c.pendingSuppliers : undefined}
          href="/suppliers"
          menuItems={[{ label: 'Ver fornecedores', href: '/suppliers' }]}
        >
          <StatBody
            value={String(c?.suppliers ?? 0)}
            sub={`${c?.activeSuppliers ?? 0} ativos · ${c?.pendingSuppliers ?? 0} pendentes`}
            icon={Truck} iconBg="bg-indigo-100" iconColor="text-indigo-600"
          />
        </PanelCard>
      )}

      {panelVisible('kpi-clients', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="kpi-clients"
          title="Clientes"
          icon={Users}
          iconClassName="text-emerald-600"
          summary={`${c?.clients ?? 0} clientes · ${c?.projects ?? 0} empreendimentos`}
          href="/clients"
          menuItems={[{ label: 'Ver clientes', href: '/clients' }]}
        >
          <StatBody
            value={String(c?.clients ?? 0)}
            sub={`${c?.projects ?? 0} empreendimento(s)`}
            icon={Users} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          />
        </PanelCard>
      )}

      {panelVisible('kpi-orders', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="kpi-orders"
          title="Pedidos abertos"
          icon={ShoppingCart}
          iconClassName="text-amber-600"
          summary={`${c?.openOrders ?? 0} abertos · ${c?.orders ?? 0} total`}
          href="/orders"
          menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}
        >
          <StatBody
            value={String(c?.openOrders ?? 0)}
            sub={`${c?.orders ?? 0} total`}
            icon={ShoppingCart} iconBg="bg-amber-100" iconColor="text-amber-600"
          />
        </PanelCard>
      )}

      {panelVisible('chart-revenue', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="chart-revenue"
          title="Receita mensal"
          icon={TrendingUp}
          priority="secondary"
          summary="Gráfico de receita"
          href="/orders"
          menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}
        >
          {(data?.monthly ?? []).some(m => m.receita > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={(v) => [fmt(Number(v)), 'Receita']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="receita" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Sem receita registrada ainda</p>
          )}
        </PanelCard>
      )}

      {panelVisible('chart-orders', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="chart-orders"
          title="Pedidos por mês"
          icon={Package}
          priority="secondary"
          summary="Gráfico de pedidos"
          href="/orders"
          menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}
        >
          {(data?.monthly ?? []).some(m => m.pedidos > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [Number(v), 'Pedidos']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="pedidos" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Sem pedidos registrados ainda</p>
          )}
        </PanelCard>
      )}

      {panelVisible('recent-orders', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="recent-orders"
          title="Pedidos recentes"
          icon={Clock}
          badge={(data?.recentOrders ?? []).length || undefined}
          summary={`${(data?.recentOrders ?? []).length} pedido(s) recente(s)`}
          href="/orders"
          menuItems={[{ label: 'Ver todos', href: '/orders' }, ...(isGestor ? [{ label: 'Novo pedido', href: '/orders?new=1' }] : [])]}
        >
          {(data?.recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido ainda.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentOrders.map(o => (
                <PanelCard
                  key={o.id}
                  panelId={`order-${o.id}`}
                  title={o.client}
                  priority="secondary"
                  defaultOpen={false}
                  summary={`${o.supplier} · ${fmt(o.value)} · ${STATUS_LABEL[o.status] ?? o.status}`}
                  headerExtra={
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  }
                  menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">{o.supplier} · {formatRelativeDate(o.date)}</p>
                    <span className="text-sm font-semibold text-gray-700">{fmt(o.value)}</span>
                  </div>
                </PanelCard>
              ))}
            </div>
          )}
        </PanelCard>
      )}

      {panelVisible('top-suppliers', { isGestor, role, hasNextStep: Boolean(nextStep) }) && (
        <PanelCard
          panelId="top-suppliers"
          title="Top fornecedores"
          icon={Truck}
          priority="secondary"
          badge={(data?.topSuppliers ?? []).length || undefined}
          summary={`${(data?.topSuppliers ?? []).length} fornecedor(es) ranqueados`}
          href="/suppliers"
          menuItems={isGestor ? [{ label: 'Ver todos', href: '/suppliers' }, { label: 'Cadastrar', href: '/suppliers' }] : [{ label: 'Ver catálogo', href: '/products' }]}
        >
          {(data?.topSuppliers ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum fornecedor ranqueado ainda.</p>
          ) : (
            <div className="space-y-2">
              {data?.topSuppliers.map(s => (
                <PanelCard
                  key={s.id}
                  panelId={`supplier-${s.id}`}
                  title={s.nome}
                  priority="secondary"
                  defaultOpen={false}
                  summary={`QCPS ${s.score} · ${s.pedidos} pedido(s)`}
                  headerExtra={<span className="text-xs font-bold text-violet-600">{s.score}</span>}
                  menuItems={isGestor ? [{ label: 'Ver fornecedores', href: '/suppliers' }] : undefined}
                >
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(s.score / 10) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">{s.pedidos} pedido(s)</p>
                </PanelCard>
              ))}
            </div>
          )}
        </PanelCard>
      )}
    </div>
  )
}
