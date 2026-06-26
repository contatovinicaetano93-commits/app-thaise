'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, GitBranch, Truck, Users, Package, ShoppingCart, Building2 } from 'lucide-react'
import { sipocApi, type SipocData } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { PanelToolbar } from '@/components/ui/PanelToolbar'
import { SIPOC } from '@/lib/sipoc'

const ICONS = { S: Truck, I: Package, P: GitBranch, O: ShoppingCart, C: Users }

const SIPOC_KEYS = ['S', 'I', 'P', 'O', 'C'] as const

const SIPOC_PANELS = [
  ...SIPOC_KEYS.map(key => ({ id: `sipoc-${key}`, priority: 'primary' as const })),
  { id: 'sipoc-flow', priority: 'secondary' as const },
]

function metricSummary(m: Record<string, unknown>): string {
  const parts = Object.entries(m)
    .filter(([k]) => k !== 'label')
    .slice(0, 3)
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').trim()
      const val = typeof v === 'number' && k.toLowerCase().includes('revenue')
        ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
        : String(v)
      return `${label}: ${val}`
    })
  return parts.join(' · ') || 'Ver métricas'
}

export default function SipocPage() {
  const [data, setData] = useState<SipocData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sipocApi.get().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton rows={6} height="h-14" />

  const metrics = data?.metrics ?? {}

  return (
    <div className="space-y-3">
      <PageFeedHeader
        title="Mapa SIPOC"
        icon={GitBranch}
        subtitle="Fornecedor → Entrada → Processo → Saída → Cliente"
        menuItems={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pedidos', href: '/orders' }]}
      />

      <PanelToolbar sections={SIPOC_PANELS} />

      <PanelCard
        panelId="sipoc-flow-strip"
        title="Fluxo S → I → P → O → C"
        icon={GitBranch}
        priority="secondary"
        defaultOpen={false}
        summary="Visão rápida do mapa operacional"
        collapsible
      >
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500">
          {SIPOC_KEYS.map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg">
                {key} — {SIPOC[key === 'S' ? 'suppliers' : key === 'I' ? 'inputs' : key === 'P' ? 'process' : key === 'O' ? 'outputs' : 'customers'].label}
              </span>
              {i < 4 && <ArrowRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>
      </PanelCard>

      <div className="space-y-2">
        {SIPOC_KEYS.map(key => {
          const Icon = ICONS[key]
          const m = (metrics[key] ?? {}) as Record<string, unknown>
          const label = String(m.label ?? key)
          return (
            <PanelCard
              key={key}
              panelId={`sipoc-${key}`}
              title={`${key} — ${label}`}
              icon={Icon}
              defaultOpen={false}
              summary={metricSummary(m)}
              badge={typeof m.total === 'number' ? m.total : typeof m.count === 'number' ? m.count : undefined}
              menuItems={[{ label: 'Ver dashboard', href: '/dashboard' }]}
            >
              <div className="space-y-1 text-sm text-gray-600">
                {Object.entries(m).filter(([k]) => k !== 'label').map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-right">
                      {typeof v === 'number' && k.toLowerCase().includes('revenue')
                        ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                        : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </PanelCard>
          )
        })}
      </div>

      <PanelCard
        panelId="sipoc-flow"
        title="Fluxo operacional"
        icon={Building2}
        priority="secondary"
        defaultOpen={false}
        summary={`${SIPOC.suppliers.label} → ${SIPOC.customers.label}`}
        menuItems={[{ label: 'Voltar ao dashboard', href: '/dashboard' }]}
      >
        <p className="text-sm text-gray-500">
          {SIPOC.suppliers.desc} → {SIPOC.inputs.desc} → {SIPOC.process.desc} → {SIPOC.outputs.desc} → {SIPOC.customers.desc}
        </p>
      </PanelCard>
    </div>
  )
}
