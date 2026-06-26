'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Layers, LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_LABELS } from '@/lib/auth/roles'
import { navBySection } from '@/components/layout/nav-config'

function initials(name?: string | null, email?: string) {
  const base = (name?.trim() || email || '?').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, profile } = useAuth()
  const sections = navBySection(role)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-[#0b1220] text-slate-300 flex flex-col border-r border-white/5">
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Layers size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate">Plataforma Thaise</h1>
            <p className="text-[11px] text-slate-500 truncate">Hub operacional QCPS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map(({ section, label, items }) => (
          <div key={section}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ href, label: itemLabel, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-emerald-400" />
                    )}
                    <Icon size={17} className={active ? 'text-emerald-400' : 'text-slate-500'} />
                    <span className="truncate">{itemLabel}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Conta</p>
        {profile && (
          <div className="rounded-xl bg-white/5 border border-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-200 shrink-0">
                {initials(profile.full_name, profile.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                aria-label="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
              {ROLE_LABELS[role]}
            </span>
          </div>
        )}
        <p className="text-[10px] text-slate-600 px-1">v1.1 · Fase 2</p>
      </div>
    </aside>
  )
}
