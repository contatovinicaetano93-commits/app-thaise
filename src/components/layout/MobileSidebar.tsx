'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_LABELS } from '@/lib/auth/roles'
import { navBySection } from '@/components/layout/nav-config'

function initials(name?: string | null, email?: string) {
  const base = (name?.trim() || email || '?').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { role, profile } = useAuth()
  const sections = navBySection(role)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl border border-white/10 shadow-lg"
        style={{ background: 'var(--estlar-obsidian)' }}
      >
        <Menu size={20} className="text-slate-200" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl lg:hidden flex flex-col border-r border-white/5"
            style={{ background: 'var(--estlar-obsidian)' }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--estlar-titanium)]">
                  Estlar
                </p>
                <span className="font-medium text-[var(--estlar-linen)] text-sm tracking-wide">
                  Hub de Arquitetura
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
              {sections.map(({ section, label, items }) => (
                <div key={section}>
                  <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(({ href, label: itemLabel, icon: Icon }) => {
                      const active = pathname.startsWith(href)
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                            active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {active && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full"
                              style={{ background: 'var(--estlar-wine-light)' }}
                            />
                          )}
                          <Icon size={17} className={active ? 'text-[var(--estlar-sand)]' : 'text-slate-500'} />
                          {itemLabel}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {profile && (
              <div className="px-3 py-4 border-t border-white/5">
                <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'color-mix(in srgb, var(--estlar-wine) 25%, transparent)',
                        color: 'var(--estlar-sand)',
                      }}
                    >
                      {initials(profile.full_name, profile.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{profile.full_name || profile.email}</p>
                      <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-semibold uppercase bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
