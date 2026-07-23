import type { ElementType } from 'react'
import {
  LayoutDashboard, Building2, Truck, Users, Package, ShoppingCart,
  Bell, FileBarChart, UserPlus, ClipboardList, Receipt,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/roles'
import { navLabelForRole } from '@/lib/flow-roles'

export type NavSection = 'fluxo'

export interface NavItem {
  href: string
  label: string
  icon: ElementType
  roles: UserRole[]
  section: NavSection
}

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  fluxo: 'Estlar Hub',
}

/** Nav do fluxo mínimo — uma seção, sem legado */
export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['gestor', 'fornecedor', 'cliente'], section: 'fluxo' },
  { href: '/projects', label: 'Obras', icon: Building2, roles: ['gestor', 'cliente'], section: 'fluxo' },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['gestor'], section: 'fluxo' },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['gestor'], section: 'fluxo' },
  { href: '/products', label: 'Catálogo', icon: Package, roles: ['gestor', 'fornecedor'], section: 'fluxo' },
  { href: '/sku-requests', label: 'SKUs solicitados', icon: ClipboardList, roles: ['fornecedor'], section: 'fluxo' },
  { href: '/quotes', label: 'Orçamentos', icon: Receipt, roles: ['gestor', 'cliente'], section: 'fluxo' },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart, roles: ['fornecedor', 'cliente'], section: 'fluxo' },
  { href: '/reports/weekly', label: 'Relatório 360', icon: FileBarChart, roles: ['gestor', 'cliente'], section: 'fluxo' },
  { href: '/users', label: 'Convidar usuário', icon: UserPlus, roles: ['gestor'], section: 'fluxo' },
  { href: '/notifications', label: 'Notificações', icon: Bell, roles: ['gestor', 'fornecedor', 'cliente'], section: 'fluxo' },
]

const GESTOR_ORDER = [
  '/dashboard',
  '/projects',
  '/suppliers',
  '/products',
  '/quotes',
  '/clients',
  '/reports/weekly',
  '/users',
  '/notifications',
] as const

function filterNavItems(items: NavItem[], role: UserRole): NavItem[] {
  let filtered = items.filter(i => i.roles.includes(role))
  if (role === 'gestor') {
    return [...filtered].sort((a, b) => {
      const ia = GESTOR_ORDER.indexOf(a.href as typeof GESTOR_ORDER[number])
      const ib = GESTOR_ORDER.indexOf(b.href as typeof GESTOR_ORDER[number])
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  }
  return filtered
}

export function navForRole(role: UserRole) {
  return filterNavItems(APP_NAV, role).map(item => ({
    ...item,
    label: navLabelForRole(item.label, item.href, role),
  }))
}

export function navBySection(role: UserRole) {
  return [{
    section: 'fluxo' as const,
    label: NAV_SECTION_LABELS.fluxo,
    items: navForRole(role),
  }]
}
