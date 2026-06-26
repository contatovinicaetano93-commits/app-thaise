'use client'

import { useState, useEffect } from 'react'
import { Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BRIEFING_QUESTIONS, type BriefingType } from '@/lib/briefing'
import { estlarApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'

interface Props {
  opportunity: Opportunity
  onSaved: () => void
}

export function BriefingPanel({ opportunity, onSaved }: Props) {
  const [type, setType] = useState<BriefingType>(opportunity.briefing_type ?? 'residencial')
  const [answers, setAnswers] = useState<Record<string, string>>(opportunity.briefing_data ?? {})
  const [saving, setSaving] = useState(false)
  const [proposal, setProposal] = useState<string | null>(null)

  const questions = BRIEFING_QUESTIONS[type]

  useEffect(() => {
    setType(opportunity.briefing_type ?? 'residencial')
    setAnswers(opportunity.briefing_data ?? {})
  }, [opportunity])

  async function save() {
    setSaving(true)
    try {
      await estlarApi.saveBriefing(opportunity.id, { briefing_type: type, briefing_data: answers })
      toast.success('Briefing estratégico salvo')
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  async function loadProposal() {
    try {
      const { content } = await estlarApi.getProposal(opportunity.id)
      setProposal(content)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800">Briefing Estratégico</h3>
      <Select
        label="Tipo de projeto"
        value={type}
        onChange={e => setType(e.target.value as BriefingType)}
        options={[
          { value: 'corporativo', label: 'Corporativo' },
          { value: 'residencial', label: 'Residencial' },
          { value: 'comercial', label: 'Comercial' },
          { value: 'desenvolvimento', label: 'Desenvolvimento Imobiliário' },
        ]}
      />
      {questions.map(q => (
        <Textarea
          key={q.id}
          label={q.label}
          value={answers[q.id] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          rows={2}
        />
      ))}
      <div className="flex gap-2">
        <Button onClick={save} loading={saving}>Salvar briefing</Button>
        <Button variant="secondary" onClick={loadProposal}>Gerar proposta</Button>
      </div>
      {proposal && (
        <details className="bg-stone-50 rounded-lg p-3">
          <summary className="text-xs font-medium cursor-pointer">Proposta Comercial Executiva</summary>
          <pre className="text-xs mt-2 whitespace-pre-wrap font-sans">{proposal}</pre>
        </details>
      )}
    </div>
  )
}
