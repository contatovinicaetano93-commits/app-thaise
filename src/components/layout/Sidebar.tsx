'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, Truck, Users, Package, ShoppingCart, ChevronRight, Code2, LogOut,
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles'

const ALL_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['gestor', 'fornecedor', 'cliente'] as UserRole[] },
  { href: '/projects', label: 'Empreendimentos', icon: Building2, roles: ['gestor', 'cliente'] as UserRole[] },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['gestor'] as UserRole[] },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['gestor'] as UserRole[] },
  { href: '/products', label: 'Catálogo', icon: Package, roles: ['gestor', 'fornecedor'] as UserRole[] },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart, roles: ['gestor', 'fornecedor', 'cliente'] as UserRole[] },
]

const navBottom = [
  { href: '/api-docs', label: 'API Docs', icon: Code2, roles: ['gestor'] as UserRole[] },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, profile } = useAuth()

  const nav = ALL_NAV.filter(item => item.roles.includes(role))
  const bottom = navBottom.filter(item => item.roles.includes(role))

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Plataforma</h1>
        <p className="text-xs text-gray-400 mt-0.5">Thaise Resende</p>
        {profile && (
          <span className="inline-block mt-2 text-[10px] font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
            {ROLE_LABELS[role]}
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-100 pt-2 space-y-1">
        {bottom.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Icon size={16} />{label}
            </Link>
          )
        })}
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full">
          <LogOut size={16} />Sair
        </button>
        <p className="text-xs text-gray-400 px-3 pt-1">v1.1 · Fase 2</p>
      </div>
    </aside>
  )
}
