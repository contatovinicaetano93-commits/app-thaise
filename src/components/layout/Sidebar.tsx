'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Truck,
  Users,
  Package,
  ShoppingCart,
  ChevronRight,
  Code2,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Empreendimentos', icon: Building2 },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/products', label: 'Catálogo', icon: Package },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart },
]

const navBottom = [
  { href: '/api-docs', label: 'API Docs', icon: Code2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Plataforma</h1>
        <p className="text-xs text-gray-400 mt-0.5">Thaise Resende</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-2 border-t border-gray-100 pt-2">
        {navBottom.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
              <Icon size={16} className={active ? 'text-indigo-600' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}
        <p className="text-xs text-gray-400 px-3 pt-2">v1.0 · MVP</p>
      </div>
    </aside>
  )
}
