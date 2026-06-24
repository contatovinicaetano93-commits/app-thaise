'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, Building2, Truck, Users, Package, ShoppingCart, Code2, Layers, LogOut, Sparkles, GitBranch, Server, UserCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { UserRole } from '@/lib/auth/roles'

const ALL_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['gestor', 'fornecedor', 'cliente'] as UserRole[] },
  { href: '/projects', label: 'Empreendimentos', icon: Building2, roles: ['gestor', 'cliente'] as UserRole[] },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['gestor'] as UserRole[] },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['gestor'] as UserRole[] },
  { href: '/products', label: 'Catálogo', icon: Package, roles: ['gestor', 'fornecedor'] as UserRole[] },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart, roles: ['gestor', 'fornecedor', 'cliente'] as UserRole[] },
  { href: '/insights', label: 'Insights AI', icon: Sparkles, roles: ['gestor'] as UserRole[] },
  { href: '/sipoc', label: 'SIPOC', icon: GitBranch, roles: ['gestor'] as UserRole[] },
  { href: '/jobs', label: 'Jobs', icon: Server, roles: ['gestor'] as UserRole[] },
  { href: '/pending-suppliers', label: 'Homologação', icon: UserCheck, roles: ['gestor'] as UserRole[] },
  { href: '/api-docs', label: 'API Docs', icon: Code2, roles: ['gestor'] as UserRole[] },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useAuth()
  const nav = ALL_NAV.filter(item => item.roles.includes(role))

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        <Menu size={20} className="text-gray-600" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl lg:hidden animate-slide-in">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Layers size={14} className="text-white" />
                </div>
                <span className="font-bold text-gray-900 text-sm">Plataforma Thaise</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400"><X size={18} /></button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${active ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon size={17} />{label}
                  </Link>
                )
              })}
              <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full mt-4">
                <LogOut size={17} />Sair
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
