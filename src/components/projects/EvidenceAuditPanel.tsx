'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldQuestion, RefreshCw, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EvidenceAudit } from '@/lib/auth/roles'

interface Props {
  audit?: EvidenceAudit
  onRunAudit?: () => Promise<void>
  onDecide?: (decision: 'approve' | 'reject' | 'override') => Promise<void>
  readOnly?: boolean
}

const STATUS_CONFIG = {
  passed: {
    icon: ShieldCheck,
    label: 'Aprovado',
    className: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  failed: {
    icon: ShieldAlert,
    label: 'Reprovado',
    className: 'bg-red-50 border-red-100 text-red-900',
    badge: 'bg-red-100 text-red-800',
  },
  pending: {
    icon: ShieldQuestion,
    label: 'Revisão pendente',
    className: 'bg-amber-50 border-amber-100 text-amber-900',
    badge: 'bg-amber-100 text-amber-800',
  },
  override: {
    icon: AlertTriangle,
    label: 'Sobrescrito pelo gestor',
    className: 'bg-violet-50 border-violet-100 text-violet-900',
    badge: 'bg-violet-100 text-violet-800',
  },
} as const

export function EvidenceAuditPanel({ audit, onRunAudit, onDecide, readOnly }: Props) {
  const [acting, setActing] = useState<string | null>(null)

  if (!audit && !onRunAudit) return null

  const config = audit ? STATUS_CONFIG[audit.status] : STATUS_CONFIG.pending
  const Icon = config.icon

  async function run(action: string, fn?: () => Promise<void>) {
    if (!fn) return
    setActing(action)
    try {
      await fn()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${audit ? config.className : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon size={15} className="shrink-0" />
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${config.badge}`}>
          Auditoria · {audit ? config.label : 'Não executada'}
        </span>
        {audit?.ai_powered && (
          <span className="text-[10px] text-violet-700 font-medium">IA visão</span>
        )}
        {audit && audit.score > 0 && (
          <span className="text-xs font-bold ml-auto">Score {audit.score}/10</span>
        )}
      </div>

      {audit?.summary && (
        <p className="text-xs leading-relaxed">{audit.summary}</p>
      )}

      {audit && audit.issues.length > 0 && (
        <ul className="text-xs space-y-0.5 list-disc pl-4 opacity-90">
          {audit.issues.map(issue => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {onRunAudit && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => run('audit', onRunAudit)}
              loading={acting === 'audit'}
            >
              <RefreshCw size={12} /> {audit ? 'Reauditar' : 'Auditar foto'}
            </Button>
          )}
          {audit && onDecide && audit.status !== 'passed' && audit.status !== 'override' && (
            <>
              <Button
                type="button"
                onClick={() => run('approve', () => onDecide('approve'))}
                loading={acting === 'approve'}
              >
                <Check size={12} /> Aprovar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => run('reject', () => onDecide('reject'))}
                loading={acting === 'reject'}
              >
                <X size={12} /> Reprovar
              </Button>
              {audit.status === 'failed' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => run('override', () => onDecide('override'))}
                  loading={acting === 'override'}
                >
                  <AlertTriangle size={12} /> Sobrescrever
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
