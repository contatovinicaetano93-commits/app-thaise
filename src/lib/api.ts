// Cliente tipado que o frontend usa para consumir /api/*
// NUNCA importe supabase diretamente nas páginas — use este arquivo

import type { Supplier, Client, Product, Order, Project } from '@/types/database'
import type { QcpsScores } from '@/lib/qcps'

type ApiResult<T> = Promise<T>

async function downloadCsv(path: string, filename: string): Promise<void> {
  const res = await fetch(path, { credentials: 'include' })
  if (!res.ok) throw new Error('Erro ao exportar')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

  exportCsv: (): Promise<void> =>
    downloadCsv('/api/clients/export', `clientes-${new Date().toISOString().slice(0, 10)}.csv`),
}

// --- Products ---
export const productsApi = {
  list: (supplierId?: string): ApiResult<Product[]> =>
    request(`/api/products${supplierId ? `?supplier_id=${supplierId}` : ''}`),

  create: (data: Omit<Product, 'id' | 'created_at'>): ApiResult<Product> =>
    request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Product>): ApiResult<Product> =>
    request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  exportCsv: (): Promise<void> =>
    downloadCsv('/api/products/export', `produtos-${new Date().toISOString().slice(0, 10)}.csv`),
}

// --- Orders ---
export const ordersApi = {
  list: (search?: string): ApiResult<Order[]> =>
    request(`/api/orders${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'total_price' | 'client' | 'supplier' | 'product' | 'project'>): ApiResult<Order> =>
    request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: string): ApiResult<Order> =>
    request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  exportCsv: (): Promise<void> =>
    downloadCsv('/api/orders/export', `pedidos-${new Date().toISOString().slice(0, 10)}.csv`),

  history: (id: string): ApiResult<Array<{ id: string; from_status: string | null; to_status: string; created_at: string }>> =>
    request(`/api/orders/${id}/history`),
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

  updateChecklist: (
    id: string,
    phase: string,
    itemId: string,
    checked: boolean,
    opts?: { evidence?: string; filePath?: string; fileName?: string },
  ): ApiResult<Project> =>
    request(`/api/projects/${id}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ phase, itemId, checked, ...opts }),
    }),

  uploadChecklistFile: async (
    id: string,
    phase: string,
    itemId: string,
    file: File,
  ): Promise<{ path: string; fileName: string; signedUrl: string }> => {
    const form = new FormData()
    form.append('file', file)
    form.append('phase', phase)
    form.append('itemId', itemId)
    const res = await fetch(`/api/projects/${id}/checklist/upload`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error ?? 'Erro ao enviar arquivo')
    return json.data
  },

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

export interface JobLogRow {
  id: string
  job_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: Record<string, unknown> | null
  error?: string | null
  created_at: string
  completed_at?: string | null
}

export interface SipocData {
  map: typeof import('@/lib/sipoc').SIPOC
  metrics: Record<string, Record<string, number | string>>
  topSuppliers: { id: string; score: number }[]
}

export interface AlertRow {
  type: string
  severity: 'warning' | 'info'
  message: string
  href?: string
}

export interface ActivityEventRow {
  id: string
  entity_type: string
  entity_id: string
  event_type: string
  title: string
  detail?: string | null
  created_at: string
}

export const jobsApi = {
  list: (): ApiResult<JobLogRow[]> => request('/api/jobs'),
  retry: (id: string): ApiResult<Record<string, unknown>> =>
    request(`/api/jobs/${id}/retry`, { method: 'POST' }),
}

export const sipocApi = {
  get: (): ApiResult<SipocData> => request('/api/sipoc'),
}

export const alertsApi = {
  list: (): ApiResult<AlertRow[]> => request('/api/alerts'),
}

export const nextStepApi = {
  get: (): ApiResult<{ next: { label: string; href: string; reason: string } | null; steps: { label: string; href: string; reason: string }[] }> =>
    request('/api/next-step'),
}

export const activityApi = {
  list: (entityType: string, entityId: string): ApiResult<ActivityEventRow[]> =>
    request(`/api/activity?entity_type=${entityType}&entity_id=${entityId}`),
}

export const assistantApi = {
  suggest: (productId?: string, category?: string): ApiResult<{ suppliers: { id: string; name: string; score: number }[]; suggestion?: { id: string; name: string; score: number }; message: string }> =>
    request('/api/assistant', { method: 'POST', body: JSON.stringify({ product_id: productId, category }) }),
}

export const reportsApi = {
  monthly: (): ApiResult<{ summary: string; metrics: Record<string, number> }> =>
    request('/api/reports/monthly'),
}

export const pendingSuppliersApi = {
  list: (): ApiResult<Supplier[]> => request('/api/suppliers/pending'),
  review: (id: string, action: 'approve' | 'reject'): ApiResult<Supplier> =>
    request('/api/suppliers/pending', { method: 'PATCH', body: JSON.stringify({ id, action }) }),
}

export const notificationsApi = {
  list: (): ApiResult<Array<{ id: string; title: string; body?: string; href?: string; read: boolean; created_at: string }>> =>
    request('/api/notifications'),
  markAllRead: (): ApiResult<{ success: boolean }> =>
    request('/api/notifications', { method: 'PATCH', body: JSON.stringify({ readAll: true }) }),
}
