'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

  async function run() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
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
    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={16} className="text-indigo-600" />
        <h4 className="text-sm font-semibold text-indigo-900">Simulação Fase A — VPL / TIR / Payback</h4>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          value={template}
          onChange={e => setTemplate(e.target.value as 'residencial' | 'comercial')}
          className="text-sm border border-indigo-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="residencial">Residencial</option>
          <option value="comercial">Comercial</option>
        </select>
        <Button onClick={run} loading={loading} className="!py-1.5 !px-3 text-xs">
          <TrendingUp size={14} />Simular
        </Button>
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
    </div>
  )
}
