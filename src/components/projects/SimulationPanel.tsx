'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import { PanelCard } from '@/components/ui/PanelCard'
import { toast } from 'sonner'

interface SimResult {
  vpl: number
  tir: number | null
  paybackAnos: number | null
  viavel: boolean
  resumo: string
}

interface Props {
  projectId: string
  phase: string
}

export function SimulationPanel({ projectId, phase }: Props) {
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<'residencial' | 'comercial'>('residencial')

  if (phase !== 'A') return null

  async function run(nextTemplate?: 'residencial' | 'comercial') {
    const tpl = nextTemplate ?? template
    if (nextTemplate) setTemplate(nextTemplate)
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: tpl }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setResult(json.data)
      toast.success(json.data.viavel ? 'Viabilidade positiva' : 'Viabilidade negativa')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na simulação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelCard
      className="mt-4 bg-indigo-50 border-indigo-100"
      title="Simulação Fase A — VPL / TIR / Payback"
      icon={Calculator}
      padding="p-4"
      defaultOpen={false}
      menuItems={[
        { label: 'Simular residencial', onClick: () => run('residencial'), disabled: loading },
        { label: 'Simular comercial', onClick: () => run('comercial'), disabled: loading },
      ]}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-indigo-700">
        <TrendingUp size={14} />
        <span>Modelo: <strong>{template === 'residencial' ? 'Residencial' : 'Comercial'}</strong></span>
      </div>
      {result && (
        <div className={`text-sm rounded-lg px-3 py-2 ${result.viavel ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{result.resumo}</p>
          <p className="text-xs mt-1 opacity-80">
            VPL: {result.vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            {result.tir != null && ` · TIR: ${result.tir}%`}
            {result.paybackAnos != null && ` · Payback: ${result.paybackAnos} anos`}
          </p>
        </div>
      )}
    </PanelCard>
  )
}
