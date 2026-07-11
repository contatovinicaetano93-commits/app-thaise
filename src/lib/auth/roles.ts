import type { ProjectPhase } from '@/lib/phases'

export type UserRole = 'gestor' | 'fornecedor' | 'cliente'

export interface Profile {
  id: string
  email: string
  full_name?: string | null
  role: UserRole
  supplier_id?: string | null
  client_id?: string | null
  onboarding_completed_at?: string | null
  created_at: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  gestor: 'Gestora Estlar',
  fornecedor: 'Fornecedor homologado',
  cliente: 'Cliente investidor',
}

/** Rotas permitidas por role (prefix match) */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  gestor: ['/dashboard', '/projects', '/sku-requests', '/suppliers', '/clients', '/products', '/quotes', '/orders', '/pending-suppliers', '/reports/weekly', '/notifications', '/users', '/acesso-pendente'],
  fornecedor: ['/dashboard', '/sku-requests', '/products', '/orders', '/notifications', '/acesso-pendente'],
  cliente: ['/dashboard', '/projects', '/quotes', '/orders', '/notifications', '/reports/weekly', '/acesso-pendente'],
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  return ROLE_ROUTES[role].some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function canManage(role: UserRole): boolean {
  return role === 'gestor'
}

export type EvidenceAuditStatus = 'pending' | 'passed' | 'failed' | 'override'

export interface EvidenceAudit {
  status: EvidenceAuditStatus
  score: number
  summary: string
  issues: string[]
  ai_powered: boolean
  audited_at: string
  approved_by?: string | null
  approved_at?: string | null
}

export type ChecklistItemValue = boolean | {
  checked: boolean
  evidence?: string
  filePath?: string
  fileName?: string
  audit?: EvidenceAudit
}

export type PhaseChecklist = Record<ProjectPhase, Record<string, ChecklistItemValue>>

export interface JobLog {
  id: string
  job_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: Record<string, unknown> | null
  error?: string | null
  created_at: string
  completed_at?: string | null
}

export interface AgentInsight {
  id: string
  entity_type: 'supplier' | 'project'
  entity_id: string
  insight: string
  scores?: Record<string, number> | null
  created_at: string
}
