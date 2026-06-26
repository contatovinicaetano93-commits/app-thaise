import type { ElementType } from 'react'
import {
  LayoutDashboard, Building2, Truck, Users, Package, ShoppingCart,
  Code2, Sparkles, GitBranch, Server, UserCheck, Bell,
} from 'lucide-react'
import type { UserRole } from '@/lib/auth/roles'

export type NavSection = 'operacao' | 'inteligencia' | 'sistema'

export interface NavItem {
  href: string
  label: string
  icon: ElementType
  roles: UserRole[]
  section: NavSection
}

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  operacao: 'Operação',
  inteligencia: 'Inteligência',
  sistema: 'Sistema',
}

export const NAV_SECTION_ORDER: NavSection[] = ['operacao', 'inteligencia', 'sistema']

export const APP_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['gestor', 'fornecedor', 'cliente'], section: 'operacao' },
  { href: '/projects', label: 'Empreendimentos', icon: Building2, roles: ['gestor', 'cliente'], section: 'operacao' },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['gestor'], section: 'operacao' },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['gestor'], section: 'operacao' },
  { href: '/products', label: 'Catálogo', icon: Package, roles: ['gestor', 'fornecedor'], section: 'operacao' },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart, roles: ['gestor', 'fornecedor', 'cliente'], section: 'operacao' },
  { href: '/notifications', label: 'Notificações', icon: Bell, roles: ['gestor', 'fornecedor', 'cliente'], section: 'operacao' },
  { href: '/pending-suppliers', label: 'Homologação', icon: UserCheck, roles: ['gestor'], section: 'operacao' },
  { href: '/insights', label: 'Insights AI', icon: Sparkles, roles: ['gestor'], section: 'inteligencia' },
  { href: '/sipoc', label: 'SIPOC', icon: GitBranch, roles: ['gestor'], section: 'inteligencia' },
  { href: '/jobs', label: 'Jobs / Fila', icon: Server, roles: ['gestor'], section: 'inteligencia' },
  { href: '/api-docs', label: 'API Docs', icon: Code2, roles: ['gestor'], section: 'sistema' },
]

export function navForRole(role: UserRole) {
  return APP_NAV.filter(item => item.roles.includes(role))
}

export function navBySection(role: UserRole) {
  const items = navForRole(role)
  return NAV_SECTION_ORDER
    .map(section => ({
      section,
      label: NAV_SECTION_LABELS[section],
      items: items.filter(i => i.section === section),
    }))
    .filter(group => group.items.length > 0)
}
