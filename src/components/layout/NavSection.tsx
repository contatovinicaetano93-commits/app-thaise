'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export function NavSection({
  section,
  label,
  items,
  pathname,
  onNavigate,
}: {
  section: string
  label: string
  items: { href: string; label: string; icon: React.ElementType }[]
  pathname: string
  onNavigate?: () => void
}) {
  const hasActive = items.some(i => pathname === i.href || pathname.startsWith(`${i.href}/`))
  const [open, setOpen] = useState(hasActive || section === 'operacao' || section === 'fluxo')

  // Reabre a seção quando a rota ativa muda (navegação client-side)
  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [pathname, hasActive])

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
                onClick={onNavigate}
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
