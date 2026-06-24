/**
 * SDK interno para agentes de compra e automações externas.
 * Usa /api/v1 (estável) com tipagem compartilhada.
 */

const BASE = process.env.THAISE_API_BASE ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const API = `${BASE.replace(/\/$/, '')}/api/v1`

type ApiEnvelope<T> = { ok: true; data: T; meta?: Record<string, unknown> } | { ok: false; error: string }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const json = (await res.json()) as ApiEnvelope<T>
  if (!json.ok) throw new Error(json.error)
  return json.data
}

export interface SupplierSuggestion {
  supplierId: string
  name: string
  score: number
  reason: string
}

export const thaiseSdk = {
  health: () => api<Record<string, unknown>>('/health'),

  listSuppliers: (params?: { search?: string; limit?: number; cursor?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.cursor) q.set('cursor', params.cursor)
    const qs = q.toString()
    return api<unknown[]>(`/suppliers${qs ? `?${qs}` : ''}`)
  },

  listOrders: (params?: { search?: string; limit?: number; cursor?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.cursor) q.set('cursor', params.cursor)
    const qs = q.toString()
    return api<unknown[]>(`/orders${qs ? `?${qs}` : ''}`)
  },

  suggestSupplier: (body: { product_id: string; client_id: string; project_id?: string }) =>
    api<SupplierSuggestion>('/assistant', { method: 'POST', body: JSON.stringify(body) }),

  runSimulation: (projectId: string, body: Record<string, number>) =>
    api<Record<string, unknown>>(`/projects/${projectId}/simulation`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  projectSummary: (projectId: string) =>
    api<{ summary: string }>(`/projects/${projectId}/summary`, { method: 'POST' }),

  projectRisk: (projectId: string) =>
    api<Record<string, unknown>>(`/projects/${projectId}/risk`),
}

export type ThaiseSdk = typeof thaiseSdk
