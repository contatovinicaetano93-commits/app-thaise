'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Building2, Truck, Users, Package, ShoppingCart, Code2, Layers } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Empreendimentos', icon: Building2 },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/products', label: 'Catálogo', icon: Package },
  { href: '/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/api-docs', label: 'API Docs', icon: Code2 },
]

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
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
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={17} className={active ? 'text-violet-600' : 'text-gray-400'} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
