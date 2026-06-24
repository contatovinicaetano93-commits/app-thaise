'use client'

import { TrendingUp, Truck, Users, ShoppingCart, Package, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const ordersData = [
  { mes: 'Jan', pedidos: 3, receita: 18400 },
  { mes: 'Fev', pedidos: 5, receita: 31200 },
  { mes: 'Mar', pedidos: 4, receita: 24800 },
  { mes: 'Abr', pedidos: 8, receita: 52000 },
  { mes: 'Mai', pedidos: 6, receita: 39600 },
  { mes: 'Jun', pedidos: 11, receita: 71500 },
]

const supplierData = [
  { nome: 'Revestimentos Silva', score: 9.2, pedidos: 14 },
  { nome: 'Marcenaria Primo',    score: 8.8, pedidos: 9  },
  { nome: 'Iluminação Top',      score: 8.1, pedidos: 6  },
  { nome: 'Hidra Express',       score: 7.5, pedidos: 4  },
]

const recentOrders = [
  { client: 'Ana Beatriz',  supplier: 'Revestimentos Silva', value: 12400, status: 'delivered',   date: 'Hoje' },
  { client: 'Carlos Melo',  supplier: 'Marcenaria Primo',    value: 8900,  status: 'processing',  date: 'Ontem' },
  { client: 'Laura Fonseca',supplier: 'Iluminação Top',      value: 3200,  status: 'approved',    date: '20 jun' },
  { client: 'Roberto Dias', supplier: 'Hidra Express',       value: 5600,  status: 'pending',     date: '19 jun' },
]

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  approved:   'bg-indigo-100 text-indigo-700',
  processing: 'bg-blue-100 text-blue-700',
  delivered:  'bg-emerald-100 text-emerald-700',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovado', processing: 'Em produção', delivered: 'Entregue',
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend }: {
  label: string; value: string; sub: string; icon: React.ElementType;
  iconBg: string; iconColor: string; trend?: 'up' | 'down'
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend === 'up' ? '+12%' : '-3%'}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        <p className="text-gray-500 mt-0.5 text-sm">Junho 2026 · dados de demonstração</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita no mês" value="R$ 71.500" sub="11 pedidos em jun" icon={TrendingUp} iconBg="bg-violet-100" iconColor="text-violet-600" trend="up" />
        <StatCard label="Fornecedores" value="4" sub="3 ativos · 1 pendente" icon={Truck} iconBg="bg-indigo-100" iconColor="text-indigo-600" />
        <StatCard label="Clientes" value="12" sub="2 novos este mês" icon={Users} iconBg="bg-emerald-100" iconColor="text-emerald-600" trend="up" />
        <StatCard label="Pedidos abertos" value="3" sub="1 atrasado" icon={ShoppingCart} iconBg="bg-amber-100" iconColor="text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-violet-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Receita mensal</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ordersData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Receita']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Area type="monotone" dataKey="receita" stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Package size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Pedidos por mês</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ordersData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [Number(v), 'Pedidos']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="pedidos" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Pedidos recentes</h3>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.client}</p>
                  <p className="text-xs text-gray-400">{o.supplier} · {o.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">{fmt(o.value)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top suppliers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Truck size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Top fornecedores</h3>
          </div>
          <div className="space-y-4">
            {supplierData.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-gray-700 truncate flex-1 pr-2">{s.nome}</p>
                  <span className="text-xs font-bold text-violet-600">{s.score}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(s.score / 10) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{s.pedidos} pedidos</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
