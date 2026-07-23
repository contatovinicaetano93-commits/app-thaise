// Cliente tipado que o frontend usa para consumir /api/*
// NUNCA importe supabase diretamente nas páginas — use este arquivo

import type { Supplier, Client, Product, Order, Project, WeeklyReport, SkuRequest, ProjectQuote } from '@/types/database'
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
  catalogIntake: {
    newThisWeek: number
    suppliersThisWeek: number
    totalInCatalog: number
    totalSuppliersInCatalog: number
  }
  monthly: { mes: string; pedidos: number; receita: number }[]
  recentOrders: { id: string; client: string; supplier: string; value: number; status: string; date: string }[]
  topSuppliers: { id: string; nome: string; score: number; pedidos: number }[]
  error?: string
}

export const dashboardApi = {
  get: (): ApiResult<DashboardStats> => request('/api/dashboard'),
}

// --- Suppliers ---
export const suppliersApi = {
  list: (search?: string): ApiResult<Supplier[]> =>
    request(`/api/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  create: (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'score' | 'score_q' | 'score_c' | 'score_p' | 'score_s'> & Partial<QcpsScores>): ApiResult<Supplier & {
    email?: { sent: boolean; provider: string; error?: string }
  }> =>
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

  invitePortal: (id: string, data?: { password?: string; full_name?: string }): ApiResult<{
    user: AppUser
    email?: { sent: boolean; provider: string; error?: string }
    temporaryPassword?: string
  }> =>
    request(`/api/clients/${id}/invite-portal`, { method: 'POST', body: JSON.stringify(data ?? {}) }),
}


// --- Products ---
export const productsApi = {
  list: (opts?: { supplierId?: string; pending?: boolean; projectId?: string }): ApiResult<Product[]> => {
    const params = new URLSearchParams()
    if (opts?.supplierId) params.set('supplier_id', opts.supplierId)
    if (opts?.pending) params.set('pending', '1')
    if (opts?.projectId) params.set('project_id', opts.projectId)
    const q = params.toString()
    return request(`/api/products${q ? `?${q}` : ''}`)
  },

  create: (data: Omit<Product, 'id' | 'created_at' | 'supplier' | 'project'> & { sku_request_id?: string }): ApiResult<Product> =>
    request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Product>): ApiResult<Product> =>
    request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  remove: (id: string): ApiResult<void> =>
    request(`/api/products/${id}`, { method: 'DELETE' }),

  exportCsv: (): Promise<void> =>
    downloadCsv('/api/products/export', `produtos-${new Date().toISOString().slice(0, 10)}.csv`),
}

export const skuRequestsApi = {
  list: (opts?: { projectId?: string; status?: string }): ApiResult<SkuRequest[]> => {
    const params = new URLSearchParams()
    if (opts?.projectId) params.set('project_id', opts.projectId)
    if (opts?.status) params.set('status', opts.status)
    const q = params.toString()
    return request(`/api/sku-requests${q ? `?${q}` : ''}`)
  },

  create: (data: {
    project_id: string
    supplier_id: string
    name: string
    category?: string
    unit?: string
    quantity_estimated?: number | null
    due_date?: string | null
    notes?: string | null
  }): ApiResult<SkuRequest> =>
    request('/api/sku-requests', { method: 'POST', body: JSON.stringify(data) }),

  action: (id: string, action: 'approve' | 'reject' | 'cancel'): ApiResult<SkuRequest> =>
    request(`/api/sku-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
}

export const projectQuotesApi = {
  list: (opts?: { projectId?: string; status?: string }): ApiResult<ProjectQuote[]> => {
    const params = new URLSearchParams()
    if (opts?.projectId) params.set('project_id', opts.projectId)
    if (opts?.status) params.set('status', opts.status)
    const q = params.toString()
    return request(`/api/project-quotes${q ? `?${q}` : ''}`)
  },

  get: (id: string): ApiResult<ProjectQuote> =>
    request(`/api/project-quotes/${id}`),

  create: (data: { project_id: string; title?: string; notes?: string | null }): ApiResult<ProjectQuote> =>
    request('/api/project-quotes', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: { title?: string; notes?: string | null; status?: 'cancelled' }): ApiResult<ProjectQuote> =>
    request(`/api/project-quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  saveLines: (
    id: string,
    lines: Array<{ product_id: string; supplier_id: string; quantity: number; unit_price: number; notes?: string | null }>,
  ): ApiResult<ProjectQuote> =>
    request(`/api/project-quotes/${id}/lines`, { method: 'PUT', body: JSON.stringify({ lines }) }),

  send: (id: string): ApiResult<ProjectQuote> =>
    request(`/api/project-quotes/${id}/send`, { method: 'POST' }),

  decide: (id: string, decision: 'approve' | 'reject', rejection_note?: string | null): ApiResult<ProjectQuote> =>
    request(`/api/project-quotes/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, rejection_note }) }),

  fulfill: (id: string): ApiResult<{ order_ids: string[]; count: number }> =>
    request(`/api/project-quotes/${id}/fulfill`, { method: 'POST' }),

  generate: (id: string): ApiResult<{
    quote: ProjectQuote
    generation: {
      lines: Array<{ product_id: string; supplier_id: string; quantity: number; unit_price: number }>
      matchmaking: Array<{
        category: string
        supplier_id: string
        supplier_name: string
        qcps_score: number
        tier: string
        alternatives: Array<{ id: string; name: string; score: number }>
      }>
      summary: string
      ai_powered: boolean
      margin_note: string
    }
  }> =>
    request(`/api/project-quotes/${id}/generate`, { method: 'POST' }),
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

  notifications: (): ApiResult<Record<string, Array<{
    order_id: string
    channel: 'whatsapp' | 'email' | 'in_app'
    status: 'sent' | 'failed' | 'stub'
    recipient: string | null
    error: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>>> =>
    request('/api/orders/notifications'),
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

  remove: (id: string): ApiResult<void> =>
    request(`/api/projects/${id}`, { method: 'DELETE' }),

  savePhases: (
    id: string,
    phases: Array<{ id?: string; name: string; weight_pct: number }>,
  ): ApiResult<import('@/types/database').ProjectPhaseRow[]> =>
    request(`/api/projects/${id}/phases`, { method: 'PUT', body: JSON.stringify({ phases }) }),

  updateProgress: (
    id: string,
    data: { progress_pct?: number; current_phase_id?: string | null; portal_enabled?: boolean },
  ): ApiResult<Project> =>
    request(`/api/projects/${id}/progress`, { method: 'PATCH', body: JSON.stringify(data) }),
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


export const reportsApi = {
  monthly: (): ApiResult<{
    summary: string
    aiPowered: boolean
    periodLabel?: string
    period?: { from: string; to: string }
    metrics: {
      orders: number
      revenue: number
      activeSuppliers: number
      avgQcps: number
      activeProjects: number
      insights: number
      delivered: number
      pending: number
    }
  }> => request('/api/reports/monthly'),
}

export const pendingSuppliersApi = {
  list: (): ApiResult<Supplier[]> => request('/api/suppliers/pending'),
  review: (id: string, action: 'approve' | 'reject'): ApiResult<Supplier & {
    email?: { sent: boolean; provider: string; error?: string }
  }> =>
    request('/api/suppliers/pending', { method: 'PATCH', body: JSON.stringify({ id, action }) }),
}

export const notificationsApi = {
  list: (): ApiResult<Array<{ id: string; title: string; body?: string; href?: string; read: boolean; created_at: string }>> =>
    request('/api/notifications'),
  markAllRead: (): ApiResult<{ success: boolean }> =>
    request('/api/notifications', { method: 'PATCH', body: JSON.stringify({ readAll: true }) }),
}

export interface AppUser {
  id: string
  email: string
  full_name: string | null
  role: 'gestor' | 'fornecedor' | 'cliente'
  supplier_id: string | null
  client_id: string | null
  created_at: string
}

export const usersApi = {
  list: (): ApiResult<AppUser[]> => request('/api/users'),
  invite: (data: {
    email: string
    password: string
    full_name: string
    role: 'fornecedor' | 'cliente'
    supplier_id?: string | null
    client_id?: string | null
    send_email?: boolean
  }): ApiResult<AppUser & { inviteEmail?: { sent: boolean; provider: string; magicLink?: string | null } }> =>
    request('/api/users/invite', { method: 'POST', body: JSON.stringify(data) }),
}

export const estlarApi = {
  listWeeklyReports: (status?: string): ApiResult<WeeklyReport[]> =>
    request(`/api/weekly-reports${status ? `?status=${status}` : ''}`),

  updateWeeklyReport: (id: string, status: 'approved' | 'sent'): ApiResult<WeeklyReport> =>
    request('/api/weekly-reports', { method: 'PATCH', body: JSON.stringify({ id, status }) }),

  generateWeeklyReport: (projectId: string): ApiResult<WeeklyReport> =>
    request(`/api/projects/${projectId}/weekly-reports`, { method: 'POST' }),

  getCap: (): ApiResult<{ cap: { max: number; label: string }; active: number; available: number; atCap: boolean }> =>
    request('/api/operational/cap'),
}
