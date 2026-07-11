import type { UserRole } from '@/lib/auth/roles'

/**
 * Modo simples (default): menu enxuto + dashboard focado no fluxo canônico.
 * Desativar: NEXT_PUBLIC_SIMPLE_MODE=0 na Vercel
 */
export function isSimpleMode(): boolean {
  return process.env.NEXT_PUBLIC_SIMPLE_MODE !== '0'
}

/** Ordem do fluxo v2 — gestora Estlar (menu enxuto) */
export const GESTOR_V2_HREFS: readonly string[] = [
  '/dashboard',
  '/projects',
  '/suppliers',
  '/products',
  '/quotes',
  '/payments',
  '/reports/weekly',
  '/users',
]

/** Rotas v2 acessíveis por deep link, fora do menu principal */
export const GESTOR_V2_SECONDARY_HREFS: readonly string[] = [
  '/clients',
  '/sku-requests',
  '/pending-suppliers',
  '/orders',
  '/notifications',
]

/** Legado — oculto no menu v2 */
export const GESTOR_LEGACY_HREFS: readonly string[] = [
  '/pipeline',
  '/insights',
  '/reports',
  '/sipoc',
  '/jobs',
  '/api-docs',
]

/** @deprecated use GESTOR_V2_HREFS */
export const GESTOR_SIMPLE_HREFS = GESTOR_V2_HREFS

/** @deprecated use GESTOR_LEGACY_HREFS */
export const GESTOR_ADVANCED_HREFS = GESTOR_LEGACY_HREFS

export const SIMPLE_NAV_SECTION = 'fluxo' as const
export const SIMPLE_NAV_SECTION_LABEL = 'Estlar Hub'

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
    filtered = filtered.filter(i => !GESTOR_LEGACY_HREFS.includes(i.href))
    const order = GESTOR_V2_HREFS
    return [...filtered].sort((a, b) => {
      const ia = order.indexOf(a.href)
      const ib = order.indexOf(b.href)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  }

  if (role === 'fornecedor') {
    return filtered.filter(i =>
      ['/dashboard', '/sku-requests', '/products', '/orders', '/payments', '/notifications'].includes(i.href),
    )
  }

  if (role === 'cliente') {
    return filtered.filter(i =>
      ['/dashboard', '/projects', '/quotes', '/orders', '/reports/weekly', '/notifications'].includes(i.href),
    )
  }

  return filtered
}

export function dashboardPanelVisible(panelId: string, role: UserRole | null, isGestor: boolean): boolean {
  if (!isSimpleMode() || !isGestor) return true
  return GESTOR_SIMPLE_DASHBOARD_PANELS.has(panelId)
}
