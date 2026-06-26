'use client'

import { useState, useRef, useEffect, type ReactNode, type ElementType } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

export interface PanelMenuItem {
  label: string
  onClick?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
}

export function PanelDropdown({ items }: { items: PanelMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  if (!items.length) return null

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        aria-label="Opções"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[10rem] bg-white border border-gray-100 rounded-xl shadow-lg py-1">
          {items.map(item =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm hover:bg-gray-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

interface PanelCardProps {
  title?: ReactNode
  icon?: ElementType
  iconClassName?: string
  menuItems?: PanelMenuItem[]
  headerRight?: ReactNode
  headerExtra?: ReactNode
  children: ReactNode
  className?: string
  defaultOpen?: boolean
  padding?: string
  rounded?: string
  collapsible?: boolean
  shadow?: boolean
  borderless?: boolean
}

export function PanelCard({
  title,
  icon: Icon,
  iconClassName = 'text-violet-600',
  menuItems,
  headerRight,
  headerExtra,
  children,
  className = '',
  defaultOpen = true,
  padding = 'p-6',
  rounded = 'rounded-2xl',
  collapsible = true,
  shadow = true,
  borderless = false,
}: PanelCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const hasHeader = Boolean(title || Icon || menuItems?.length || headerRight || collapsible)
  const borderClass = borderless || /border-/.test(className) ? '' : 'border border-gray-100'
  const shadowClass = shadow ? 'shadow-sm' : ''
  const bgClass = className.includes('bg-') ? '' : 'bg-white'

  if (!hasHeader) {
    return (
      <div className={`${bgClass} ${rounded} ${borderClass} ${shadowClass} ${padding} ${className}`}>
        {children}
      </div>
    )
  }

  return (
    <div className={`${bgClass} ${rounded} ${borderClass} ${shadowClass} ${className}`}>
      <div className={`flex items-start justify-between gap-2 ${padding} ${open ? 'pb-0' : ''}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          {Icon && <Icon size={16} className={`${iconClassName} shrink-0`} />}
          {title && (
            typeof title === 'string'
              ? <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
              : title
          )}
          {headerExtra}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {headerRight}
          {menuItems && menuItems.length > 0 && <PanelDropdown items={menuItems} />}
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label={open ? 'Recolher' : 'Expandir'}
              aria-expanded={open}
            >
              <ChevronDown size={16} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
          )}
        </div>
      </div>
      {open && <div className={`${padding} pt-3`}>{children}</div>}
    </div>
  )
}
