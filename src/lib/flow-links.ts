/** URLs com query params para abrir formulários pré-preenchidos no fluxo canônico. */

export function orderCreateUrl(params?: {
  projectId?: string
  clientId?: string
  supplierId?: string
}) {
  const q = new URLSearchParams({ new: '1' })
  if (params?.projectId) q.set('project_id', params.projectId)
  if (params?.clientId) q.set('client_id', params.clientId)
  if (params?.supplierId) q.set('supplier_id', params.supplierId)
  return `/orders?${q.toString()}`
}

export function projectCreateUrl(clientId?: string) {
  const q = new URLSearchParams({ new: '1' })
  if (clientId) q.set('client_id', clientId)
  return `/projects?${q.toString()}`
}

export function productCreateUrl(supplierId?: string) {
  const q = new URLSearchParams({ new: '1' })
  if (supplierId) q.set('supplier_id', supplierId)
  return `/products?${q.toString()}`
}

export function inviteUserUrl(params: { role: 'cliente' | 'fornecedor'; clientId?: string; supplierId?: string }) {
  const q = new URLSearchParams({ role: params.role })
  if (params.clientId) q.set('client_id', params.clientId)
  if (params.supplierId) q.set('supplier_id', params.supplierId)
  return `/users?${q.toString()}`
}
