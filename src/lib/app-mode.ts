import type { UserRole } from '@/lib/auth/roles'

/**
 * Modo simples (default): menu enxuto + dashboard focado no fluxo canônico.
 * Desativar: NEXT_PUBLIC_SIMPLE_MODE=0 na Vercel
 */
export function isSimpleMode(): boolean {
  return process.env.NEXT_PUBLIC_SIMPLE_MODE !== '0'
}

/** Ordem do fluxo diário — gestora Estlar */
export const GESTOR_SIMPLE_HREFS: readonly string[] = [
  '/dashboard',
  '/pipeline',
  '/projects',
  '/pending-suppliers',
  '/suppliers',
  '/products',
  '/orders',
  '/clients',
  '/reports/weekly',
  '/users',
  '/notifications',
]

/** Rotas avançadas — ocultas no menu, APIs e URLs continuam funcionando */
export const GESTOR_ADVANCED_HREFS: readonly string[] = [
  '/insights',
  '/reports',
  '/sipoc',
  '/jobs',
  '/api-docs',
]

export const SIMPLE_NAV_SECTION = 'fluxo' as const
export const SIMPLE_NAV_SECTION_LABEL = 'Fluxo Estlar'

/** Painéis do dashboard no modo simples (gestora) */
export const GESTOR_SIMPLE_DASHBOARD_PANELS = new Set([
  'next-step',
  'catalog-intake',
  'kpi-orders',
  'recent-orders',
])

export function filterNavItems<T extends { href: string; roles: UserRole[] }>(
  items: T[],
  role: UserRole,
): T[] {
  let filtered = items.filter(i => i.roles.includes(role))

  if (!isSimpleMode()) return filtered

  if (role === 'gestor') {
    filtered = filtered.filter(i => !GESTOR_ADVANCED_HREFS.includes(i.href))
    const order = GESTOR_SIMPLE_HREFS
    return [...filtered].sort((a, b) => {
      const ia = order.indexOf(a.href)
      const ib = order.indexOf(b.href)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  }

  if (role === 'fornecedor') {
    return filtered.filter(i =>
      ['/dashboard', '/products', '/orders', '/notifications'].includes(i.href),
    )
  }

  if (role === 'cliente') {
    return filtered.filter(i =>
      ['/dashboard', '/projects', '/orders', '/reports/weekly', '/notifications'].includes(i.href),
    )
  }

  return filtered
}

export function dashboardPanelVisible(panelId: string, role: UserRole | null, isGestor: boolean): boolean {
  if (!isSimpleMode() || !isGestor) return true
  return GESTOR_SIMPLE_DASHBOARD_PANELS.has(panelId)
}
