'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_LABELS } from '@/lib/auth/roles'
import { navBySection } from '@/components/layout/nav-config'
import { LogoutButton } from '@/components/layout/LogoutButton'

function initials(name?: string | null, email?: string) {
  const base = (name?.trim() || email || '?').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

function SidebarSection({
  section,
  label,
  items,
  pathname,
}: {
  section: string
  label: string
  items: { href: string; label: string; icon: React.ElementType }[]
  pathname: string
}) {
  const hasActive = items.some(i => pathname === i.href || pathname.startsWith(`${i.href}/`))
  const [open, setOpen] = useState(hasActive || section === 'operacao')

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-300 transition-colors group"
      >
        {label}
        <ChevronDown
          size={13}
          className={`text-slate-600 group-hover:text-slate-400 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
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
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full"
                    style={{ background: 'var(--estlar-wine-light)' }}
                  />
                )}
                <Icon size={17} className={active ? 'text-[var(--estlar-sand)]' : 'text-slate-500'} />
                <span className="truncate">{itemLabel}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { role, profile } = useAuth()
  const sections = navBySection(role)

  return (
    <aside
      className="w-64 min-h-screen text-slate-300 flex flex-col border-r border-white/5"
      style={{ background: 'var(--estlar-obsidian)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--estlar-titanium)]">
          Estlar
        </p>
        <h1 className="text-sm font-medium text-[var(--estlar-linen)] tracking-wide truncate mt-0.5">
          Hub de Arquitetura
        </h1>
        <p className="text-[10px] text-[var(--estlar-titanium)] truncate mt-1 tracking-wide">
          Inteligência · Método QCPS
        </p>
      </div>

      {/* Nav com seções colapsáveis */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map(({ section, label, items }) => (
          <SidebarSection
            key={section}
            section={section}
            label={label}
            items={items}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Perfil + Sair */}
      {profile && (
        <div className="px-3 py-4 border-t border-white/5">
          <div className="rounded-xl bg-white/5 border border-white/5 p-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: 'color-mix(in srgb, var(--estlar-wine) 25%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--estlar-wine-light) 40%, transparent)',
                  color: 'var(--estlar-sand)',
                }}
              >
                {initials(profile.full_name, profile.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
              {ROLE_LABELS[role]}
            </span>
            <LogoutButton variant="prominent" className="mt-3" />
          </div>
          <p className="text-[10px] text-slate-600 px-1 mt-3">v1.1 · Fase 2</p>
        </div>
      )}
    </aside>
  )
}
