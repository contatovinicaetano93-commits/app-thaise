'use client'

import { useState } from 'react'
import { GripVertical, Trophy, XCircle } from 'lucide-react'
import { opportunitiesApi } from '@/lib/api'
import {
  PIPELINE_STAGES,
  SOURCE_LABELS,
  STAGE_LABELS,
  formatBudget,
  type OpportunityStage,
} from '@/lib/pipeline'
import { toast } from 'sonner'
import type { Opportunity } from '@/types/database'
import { intakeStatusLabel, intakeStatusColor } from '@/lib/intake'

const WON_STAGE = 'ganho'

function OpportunityCard({
  opp,
  onEdit,
  onMarkLost,
}: {
  opp: Opportunity
  onEdit: (o: Opportunity) => void
  onMarkLost: (o: Opportunity) => void
}) {
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/opportunity-id', opp.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-violet-300 transition-colors"
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-gray-300 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onEdit(opp)} className="text-left w-full">
            <p className="font-semibold text-sm text-gray-900 truncate">{opp.name}</p>
            {opp.company && <p className="text-xs text-gray-500 truncate">{opp.company}</p>}
          </button>
          <p className="text-xs font-medium text-violet-700 mt-1.5">{formatBudget(opp.budget_estimate)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{SOURCE_LABELS[opp.source]}</p>
          {opp.intake_status && (
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1.5 ${intakeStatusColor(opp.intake_status)}`}>
              Intake: {intakeStatusLabel(opp.intake_status)} {opp.intake_score != null ? `(${opp.intake_score})` : ''}
            </span>
          )}
          {opp.notes && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 border-t border-gray-50 pt-2">{opp.notes}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-2 pt-2 border-t border-gray-50">
        <button
          type="button"
          onClick={() => onMarkLost(opp)}
          className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1"
        >
          <XCircle size={12} /> Perdido
        </button>
      </div>
    </div>
  )
}

function KanbanColumn({
  stageId,
  label,
  desc,
  items,
  variant,
  onDrop,
  onEdit,
  onMarkLost,
}: {
  stageId: string
  label: string
  desc?: string
  items: Opportunity[]
  variant?: 'default' | 'won'
  onDrop: (id: string, stage: string) => void
  onEdit: (o: Opportunity) => void
  onMarkLost: (o: Opportunity) => void
}) {
  const [over, setOver] = useState(false)
  const isWon = variant === 'won'

  return (
    <div
      className={`flex flex-col min-w-[260px] max-w-[280px] shrink-0 rounded-xl border ${
        isWon
          ? over ? 'border-emerald-400 bg-emerald-50/80' : 'border-emerald-200 bg-emerald-50/40'
          : over ? 'border-violet-400 bg-violet-50/50' : 'border-gray-200 bg-gray-50/80'
      }`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const id = e.dataTransfer.getData('text/opportunity-id')
        if (id) onDrop(id, stageId)
      }}
    >
      <div className={`p-3 border-b ${isWon ? 'border-emerald-200' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          {isWon && <Trophy size={14} className="text-emerald-600" />}
          <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
          {!isWon && (
            <span className="ml-auto text-xs font-medium text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {desc && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{desc}</p>}
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {items.map(opp => (
          <OpportunityCard key={opp.id} opp={opp} onEdit={onEdit} onMarkLost={onMarkLost} />
        ))}
        {isWon && (
          <p className="text-xs text-emerald-700/70 text-center py-6 px-2">
            Arraste aqui para fechar a Obra Fechada
          </p>
        )}
      </div>
    </div>
  )
}

interface Props {
  opportunities: Opportunity[]
  onRefresh: () => void
  onEdit: (o: Opportunity) => void
  onMarkLost: (o: Opportunity) => void
  onRequestConvert: (o: Opportunity) => void
}

export function PipelineKanban({ opportunities, onRefresh, onEdit, onMarkLost, onRequestConvert }: Props) {
  async function handleDrop(id: string, stage: string) {
    const opp = opportunities.find(o => o.id === id)
    if (!opp) return

    if (stage === WON_STAGE) {
      onRequestConvert(opp)
      return
    }

    if (stage === opp.stage) return

    try {
      await opportunitiesApi.moveStage(id, stage)
      toast.success(`Movido para ${STAGE_LABELS[stage as OpportunityStage]}`)
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao mover')
    }
  }

  const byStage = (stage: string) => opportunities.filter(o => o.stage === stage)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {PIPELINE_STAGES.map(col => (
        <KanbanColumn
          key={col.id}
          stageId={col.id}
          label={col.label}
          desc={col.desc}
          items={byStage(col.id)}
          onDrop={handleDrop}
          onEdit={onEdit}
          onMarkLost={onMarkLost}
        />
      ))}
      <KanbanColumn
        stageId={WON_STAGE}
        label="Ganho — Obra Fechada"
        desc="Converte em Cliente + Empreendimento Fase A"
        items={[]}
        onDrop={handleDrop}
        onEdit={onEdit}
        onMarkLost={onMarkLost}
        variant="won"
      />
    </div>
  )
}
