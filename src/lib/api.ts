// Cliente tipado que o frontend usa para consumir /api/*
// NUNCA importe supabase diretamente nas páginas — use este arquivo

import type { Supplier, Client, Product, Order, Project } from '@/types/database'
import type { QcpsScores } from '@/lib/qcps'

type ApiResult<T> = Promise<T>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const json = await res.json()
  if (!json.ok) {
    const msg = json.error ?? 'Erro desconhecido'
    if (res.status === 401) throw new Error('Sessão expirada — faça login novamente')
    if (res.status === 422) throw new Error(`Dados inválidos: ${msg}`)
    if (res.status >= 500) throw new Error(`Erro no servidor: ${msg}`)
    throw new Error(msg)
  }
  return json.data as T
}

export interface DashboardStats {
  counts: {
    suppliers: number
    activeSuppliers: number
    pendingSuppliers: number
    clients: number
    projects: number
    orders: number
    openOrders: number
    monthRevenue: number
    monthOrders: number
  }
  monthly: { mes: string; pedidos: number; receita: number }[]
  recentOrders: { id: string; client: string; supplier: string; value: number; status: string; date: string }[]
  topSuppliers: { id: string; nome: string; score: number; pedidos: number }[]
  error?: string
}

export interface AgentInsightRow {
  id: string
  entity_type: 'supplier' | 'project'
  entity_id: string
  insight: string
  scores?: Record<string, number> | null
  created_at: string
}

export const dashboardApi = {
  get: (): ApiResult<DashboardStats> => request('/api/dashboard'),
}

export const insightsApi = {
  list: (): ApiResult<AgentInsightRow[]> => request('/api/insights'),
}

// --- Suppliers ---
export const suppliersApi = {
  list: (search?: string): ApiResult<Supplier[]> =>
    request(`/api/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'score' | 'score_q' | 'score_c' | 'score_p' | 'score_s'> & Partial<QcpsScores>): ApiResult<Supplier> =>
    request('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Supplier>): ApiResult<Supplier> =>
    request(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string): ApiResult<void> =>
    request(`/api/suppliers/${id}`, { method: 'DELETE' }),
}

// --- Clients ---
export const clientsApi = {
  list: (search?: string): ApiResult<Client[]> =>
    request(`/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): ApiResult<Client> =>
    request('/api/clients', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Client>): ApiResult<Client> =>
    request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string): ApiResult<void> =>
    request(`/api/clients/${id}`, { method: 'DELETE' }),
}

// --- Products ---
export const productsApi = {
  list: (supplierId?: string): ApiResult<Product[]> =>
    request(`/api/products${supplierId ? `?supplier_id=${supplierId}` : ''}`),

  create: (data: Omit<Product, 'id' | 'created_at'>): ApiResult<Product> =>
    request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Product>): ApiResult<Product> =>
    request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// --- Orders ---
export const ordersApi = {
  list: (search?: string): ApiResult<Order[]> =>
    request(`/api/orders${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'total_price' | 'client' | 'supplier' | 'product' | 'project'>): ApiResult<Order> =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: string): ApiResult<Order> =>
    request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// --- Projects ---
export const projectsApi = {
  list: (search?: string): ApiResult<Project[]> =>
    request(`/api/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client' | 'phase'> & Partial<Pick<Project, 'phase'>>): ApiResult<Project> =>
    request('/api/projects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Project>): ApiResult<Project> =>
    request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  advancePhase: (id: string): ApiResult<Project> =>
    request(`/api/projects/${id}/phase`, { method: 'PATCH', body: JSON.stringify({}) }),

  updateChecklist: (id: string, phase: string, itemId: string, checked: boolean): ApiResult<Project> =>
    request(`/api/projects/${id}/checklist`, { method: 'PATCH', body: JSON.stringify({ phase, itemId, checked }) }),

  remove: (id: string): ApiResult<void> =>
    request(`/api/projects/${id}`, { method: 'DELETE' }),
}

// --- Agent (AI Scoring) ---
export const agentsApi = {
  scoreSupplier: (id: string): ApiResult<{ scores: QcpsScores; insight: string; average: number }> =>
    request(`/api/agents/score-supplier/${id}`, { method: 'POST' }),

  scoreProject: (id: string): ApiResult<{ scores: QcpsScores; insight: string; average: number }> =>
    request(`/api/agents/score-project/${id}`, { method: 'POST' }),
}
