import type { ProjectPhase } from '@/lib/phases'

export type UserRole = 'gestor' | 'fornecedor' | 'cliente'

export interface Profile {
  id: string
  email: string
  full_name?: string | null
  role: UserRole
  supplier_id?: string | null
  client_id?: string | null
  created_at: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  gestor: 'Gestor / Curador',
  fornecedor: 'Fornecedor',
  cliente: 'Cliente',
}

/** Rotas permitidas por role (prefix match) */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  gestor: ['/dashboard', '/projects', '/suppliers', '/clients', '/products', '/orders', '/api-docs'],
  fornecedor: ['/dashboard', '/products', '/orders'],
  cliente: ['/dashboard', '/projects', '/orders'],
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  return ROLE_ROUTES[role].some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function canManage(role: UserRole): boolean {
  return role === 'gestor'
}

export type PhaseChecklist = Record<ProjectPhase, Record<string, boolean>>

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
