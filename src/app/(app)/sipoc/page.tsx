'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, GitBranch, Truck, Users, Package, ShoppingCart, Building2 } from 'lucide-react'
import { sipocApi, type SipocData } from '@/lib/api'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { SIPOC } from '@/lib/sipoc'

const ICONS = { S: Truck, I: Package, P: GitBranch, O: ShoppingCart, C: Users }

export default function SipocPage() {
  const [data, setData] = useState<SipocData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sipocApi.get().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <ListSkeleton rows={3} height="h-32" />

  const metrics = data?.metrics ?? {}

  return (
    <div>
      <PageFeedHeader
        title="Mapa SIPOC"
        icon={GitBranch}
        subtitle="Fornecedor → Entrada → Processo → Saída → Cliente"
        menuItems={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pedidos', href: '/orders' }]}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-sm font-medium text-gray-500">
        {(['S', 'I', 'P', 'O', 'C'] as const).map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg">{key} — {SIPOC[key === 'S' ? 'suppliers' : key === 'I' ? 'inputs' : key === 'P' ? 'process' : key === 'O' ? 'outputs' : 'customers'].label}</span>
            {i < 4 && <ArrowRight size={14} className="text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {(['S', 'I', 'P', 'O', 'C'] as const).map(key => {
          const Icon = ICONS[key]
          const m = metrics[key] ?? {}
          return (
            <PanelCard
              key={key}
              title={String(m.label ?? key)}
              icon={Icon}
              padding="p-5"
              menuItems={[{ label: 'Ver dashboard', href: '/dashboard' }]}
            >
              <div className="space-y-1 text-sm text-gray-600">
                {Object.entries(m).filter(([k]) => k !== 'label').map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium">{typeof v === 'number' && k.includes('revenue') ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : v}</span>
                  </div>
                ))}
              </div>
            </PanelCard>
          )
        })}
      </div>

      <PanelCard
        className="mt-6"
        title="Fluxo operacional"
        icon={Building2}
        padding="p-5"
        menuItems={[{ label: 'Voltar ao dashboard', href: '/dashboard' }]}
      >
        <p className="text-sm text-gray-500">
          {SIPOC.suppliers.desc} → {SIPOC.inputs.desc} → {SIPOC.process.desc} → {SIPOC.outputs.desc} → {SIPOC.customers.desc}
        </p>
      </PanelCard>
    </div>
  )
}
