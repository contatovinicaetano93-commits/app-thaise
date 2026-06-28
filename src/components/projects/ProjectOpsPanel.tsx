'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { estlarApi } from '@/lib/api'
import { toast } from 'sonner'
import type { ScopeAmendment, Quotation, WelcomeKit } from '@/types/database'

interface Props {
  projectId: string
  projectName: string
  readOnly?: boolean
}

export function ProjectOpsPanel({ projectId, projectName, readOnly }: Props) {
  const [welcomeKit, setWelcomeKit] = useState<WelcomeKit | null>(null)
  const [diaryPlanned, setDiaryPlanned] = useState('')
  const [diaryActual, setDiaryActual] = useState('')
  const [diaryRisks, setDiaryRisks] = useState('')
  const [amendments, setAmendments] = useState<ScopeAmendment[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [amendDesc, setAmendDesc] = useState('')
  const [amendAmount, setAmendAmount] = useState('')
  const [amendDays, setAmendDays] = useState('0')
  const [quoteDesc, setQuoteDesc] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [kit, diary, amends, quotes] = await Promise.all([
        estlarApi.getWelcomeKit(projectId).catch(() => null),
        estlarApi.listDiary(projectId),
        estlarApi.listAmendments(projectId),
        estlarApi.listQuotations(projectId),
      ])
      setWelcomeKit(kit)
      setAmendments(amends)
      setQuotations(quotes)
      const latest = diary[0]
      if (latest) {
        setDiaryPlanned(latest.planned ?? '')
        setDiaryActual(latest.actual ?? '')
        setDiaryRisks(latest.risks ?? '')
      }
    } catch {
      toast.error('Erro ao carregar operações do projeto')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function saveDiary() {
    setSaving(true)
    try {
      await estlarApi.saveDiary(projectId, { planned: diaryPlanned, actual: diaryActual, risks: diaryRisks })
      toast.success('Diário de obra salvo')
      await estlarApi.generateWeeklyReport(projectId)
      toast.success('Rascunho do Relatório 360 atualizado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  async function addAmendment() {
    if (!amendDesc.trim()) return
    try {
      await estlarApi.createAmendment(projectId, {
        description: amendDesc,
        amount: Number(amendAmount) || 0,
        days_added: Number(amendDays) || 0,
      })
      setAmendDesc('')
      setAmendAmount('')
      toast.success('Termo aditivo criado')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function addQuotation() {
    if (!quoteDesc.trim()) return
    try {
      await estlarApi.createQuotation(projectId, {
        description: quoteDesc,
        amount: Number(quoteAmount) || 0,
      })
      setQuoteDesc('')
      setQuoteAmount('')
      toast.success('Cotação adicionada')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro')
    }
  }

  if (loading) return <p className="text-xs text-gray-400 py-4">Carregando operações Estlar...</p>

  return (
    <div className="space-y-5 mt-4 pt-4 border-t border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800">
        {readOnly ? 'Seu empreendimento' : `Operações Estlar — ${projectName}`}
      </h3>

      {welcomeKit && (
        <details className="bg-stone-50 rounded-lg p-3">
          <summary className="text-xs font-medium text-stone-600 cursor-pointer">Welcome Kit (gerado na conversão)</summary>
          <pre className="text-xs text-stone-700 mt-2 whitespace-pre-wrap font-sans">{welcomeKit.content}</pre>
        </details>
      )}

      {!readOnly && (
        <>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Diário de Obra (semana atual)</p>
            <Textarea label="Previsto" value={diaryPlanned} onChange={e => setDiaryPlanned(e.target.value)} rows={2} />
            <Textarea label="Realizado" value={diaryActual} onChange={e => setDiaryActual(e.target.value)} rows={2} />
            <Textarea label="Riscos" value={diaryRisks} onChange={e => setDiaryRisks(e.target.value)} rows={2} />
            <Button onClick={saveDiary} loading={saving}>Salvar diário + atualizar 360</Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Termo Aditivo</p>
            <Textarea label="Descrição da alteração" value={amendDesc} onChange={e => setAmendDesc(e.target.value)} placeholder="Descrição da alteração de escopo..." rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Valor R$" type="number" placeholder="Valor R$" value={amendAmount} onChange={e => setAmendAmount(e.target.value)} />
              <Input label="Dias adicionais" type="number" placeholder="Dias adicionais" value={amendDays} onChange={e => setAmendDays(e.target.value)} />
            </div>
            <Button variant="secondary" onClick={addAmendment}>Criar aditivo</Button>
            {amendments.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-1 mt-2">
                {amendments.map(a => (
                  <li key={a.id}>#{a.number} — R$ {a.amount.toLocaleString('pt-BR')} · {a.status}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Comparador de Cotações QCPS</p>
            <Input label="Descrição do lance" value={quoteDesc} onChange={e => setQuoteDesc(e.target.value)} placeholder="Descrição do lance" />
            <Input label="Valor R$" type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Valor R$" />
            <Button variant="secondary" onClick={addQuotation}>Adicionar cotação</Button>
            {quotations.length > 0 && (
              <div className="space-y-1 mt-2">
                {quotations.map(q => (
                  <div key={q.id} className={`flex items-center justify-between text-xs p-2 rounded ${q.selected ? 'bg-violet-100' : 'bg-white'}`}>
                    <span>{q.description} — R$ {q.amount.toLocaleString('pt-BR')}</span>
                    <span className="font-medium">QCPS {q.qcps_total?.toFixed(1) ?? '—'}</span>
                  </div>
                ))}
                {quotations[0] && !quotations.some(q => q.selected) && (
                  <Button onClick={async () => {
                    await estlarApi.selectQuotation(projectId, quotations[0].id)
                    toast.success('Melhor cotação selecionada')
                    load()
                  }}>
                    Selecionar melhor QCPS
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
