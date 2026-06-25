'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Truck, Users, ShoppingCart, Package, Clock, Plus,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { dashboardApi, type DashboardStats, nextStepApi, reportsApi } from '@/lib/api'
import { formatRelativeDate } from '@/lib/format'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { AlertsBanner } from '@/components/ui/AlertsBanner'
import { PanelCard } from '@/components/ui/PanelCard'
import { FirstProjectWizard } from '@/components/projects/FirstProjectWizard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useLiveRefresh } from '@/lib/hooks'
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

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, href }: {
  label: string; value: string; sub: string; icon: React.ElementType
  iconBg: string; iconColor: string; href?: string
}) {
  return (
    <PanelCard
      title={label}
      padding="p-5"
      menuItems={href ? [{ label: 'Ver detalhes', href }] : undefined}
    >
      <div className={`p-2.5 rounded-xl ${iconBg} w-fit mb-3`}>
        <Icon size={18} className={iconColor} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </PanelCard>
  )
}

export default function DashboardPage() {
  const { isGestor } = useAuth()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [nextStep, setNextStep] = useState<{ label: string; href: string; reason: string } | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [monthlyReport, setMonthlyReport] = useState<string | null>(null)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [dash, step, report] = await Promise.all([
        dashboardApi.get().then(setData),
        nextStepApi.get().then(r => setNextStep(r.next)),
        reportsApi.monthly().then(r => setMonthlyReport(r.summary)).catch(() => setMonthlyReport(null)),
      ])
      void dash
      void step
      void report
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : 'Erro ao carregar dashboard')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useLiveRefresh(refresh, ['clients', 'products', 'orders', 'suppliers', 'projects'])

  useEffect(() => {
    if (!loading && isGestor && data?.counts.projects === 0) {
      const dismissed = sessionStorage.getItem('wizard-dismissed')
      if (!dismissed) setShowWizard(true)
    }
  }, [loading, isGestor, data?.counts.projects])

  const c = data?.counts
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}
        </div>
        <ListSkeleton rows={2} height="h-48" />
      </div>
    )
  }

  const isEmpty = !c || (c.orders === 0 && c.suppliers === 0 && c.clients === 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <FirstProjectWizard
        open={showWizard}
        onClose={() => {
          sessionStorage.setItem('wizard-dismissed', '1')
          setShowWizard(false)
        }}
      />
      <AlertsBanner />

      {nextStep && (
        <PanelCard
          title="Próximo passo"
          className="bg-violet-50 border-violet-100"
          padding="p-4"
          menuItems={[{ label: 'Ir para ação', href: nextStep.href }]}
        >
          <p className="font-semibold text-gray-900">{nextStep.label}</p>
          <p className="text-sm text-gray-500 mt-1">{nextStep.reason}</p>
          <Link href={nextStep.href} className="inline-block mt-2 text-sm text-violet-600 hover:underline">Continuar →</Link>
        </PanelCard>
      )}

      {monthlyReport && (
        <PanelCard title="Resumo do mês" icon={TrendingUp} padding="p-4" menuItems={[{ label: 'Ver insights', href: '/insights' }]}>
          <p className="text-sm text-gray-600 leading-relaxed">{monthlyReport}</p>
        </PanelCard>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
          <p className="text-gray-500 mt-0.5 text-sm capitalize">{monthLabel} · dados reais</p>
        </div>
        {isEmpty && (
          <Link href="/suppliers" className="text-sm font-medium text-violet-600 hover:text-violet-800 flex items-center gap-1">
            <Plus size={16} />Começar
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Receita no mês"
          value={fmt(c?.monthRevenue ?? 0)}
          sub={`${c?.monthOrders ?? 0} pedido(s) este mês`}
          icon={TrendingUp} iconBg="bg-violet-100" iconColor="text-violet-600"
          href="/orders"
        />
        <StatCard
          label="Fornecedores"
          value={String(c?.suppliers ?? 0)}
          sub={`${c?.activeSuppliers ?? 0} ativos · ${c?.pendingSuppliers ?? 0} pendentes`}
          icon={Truck} iconBg="bg-indigo-100" iconColor="text-indigo-600"
          href="/suppliers"
        />
        <StatCard
          label="Clientes"
          value={String(c?.clients ?? 0)}
          sub={`${c?.projects ?? 0} empreendimento(s)`}
          icon={Users} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          href="/clients"
        />
        <StatCard
          label="Pedidos abertos"
          value={String(c?.openOrders ?? 0)}
          sub={`${c?.orders ?? 0} total`}
          icon={ShoppingCart} iconBg="bg-amber-100" iconColor="text-amber-600"
          href="/orders"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelCard title="Receita mensal" icon={TrendingUp} menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}>
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
            <p className="text-sm text-gray-400 text-center py-16">Sem receita registrada ainda</p>
          )}
        </PanelCard>

        <PanelCard title="Pedidos por mês" icon={Package} menuItems={[{ label: 'Ver pedidos', href: '/orders' }]}>
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
            <p className="text-sm text-gray-400 text-center py-16">Sem pedidos registrados ainda</p>
          )}
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelCard
          className="lg:col-span-2"
          title="Pedidos recentes"
          icon={Clock}
          headerRight={<Link href="/orders" className="text-xs text-violet-600 hover:underline">Ver todos</Link>}
          menuItems={[{ label: 'Novo pedido', href: '/orders' }]}
        >
          {(data?.recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum pedido ainda. <Link href="/orders" className="text-violet-600 hover:underline">Criar pedido</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {data?.recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{o.client}</p>
                    <p className="text-xs text-gray-400">{o.supplier} · {formatRelativeDate(o.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">{fmt(o.value)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Top fornecedores"
          icon={Truck}
          headerRight={<Link href="/suppliers" className="text-xs text-violet-600 hover:underline">Ver todos</Link>}
          menuItems={[{ label: 'Cadastrar fornecedor', href: '/suppliers' }]}
        >
          {(data?.topSuppliers ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              <Link href="/suppliers" className="text-violet-600 hover:underline">Cadastrar fornecedor</Link>
            </p>
          ) : (
            <div className="space-y-4">
              {data?.topSuppliers.map(s => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate flex-1 pr-2">{s.nome}</p>
                    <span className="text-xs font-bold text-violet-600">{s.score}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(s.score / 10) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.pedidos} pedido(s)</p>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  )
}
