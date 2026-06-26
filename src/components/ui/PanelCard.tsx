'use client'

import { useState, useRef, useEffect, type ReactNode, type ElementType } from 'react'
import { ChevronDown, MoreHorizontal, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { PanelPriority } from '@/lib/use-panel-state'
import { usePanelSection } from '@/lib/use-panel-state'

export interface PanelMenuItem {
  label: string
  onClick?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
}

export function PanelDropdown({
  items,
  compact = false,
  variant,
  label = 'Ações rápidas',
}: {
  items: PanelMenuItem[]
  compact?: boolean
  variant?: 'panel' | 'icon' | 'button'
  label?: string
}) {
  const resolvedVariant = variant ?? (compact ? 'icon' : 'panel')
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
        className={
          resolvedVariant === 'button'
            ? 'inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 transition-colors shadow-sm'
            : resolvedVariant === 'icon'
              ? 'flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm'
              : 'flex items-center justify-center h-full px-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-100'
        }
        aria-label={resolvedVariant === 'button' ? label : 'Opções'}
        aria-expanded={open}
      >
        {resolvedVariant === 'button' ? (
          <>
            {label}
            <ChevronDown
              size={15}
              className={`text-violet-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        ) : (
          <MoreHorizontal size={16} />
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1.5 z-30 min-w-[11rem] bg-white border border-gray-100 rounded-xl shadow-lg py-1 ${
            resolvedVariant === 'button' ? 'left-0' : 'right-0'
          }`}
        >
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
  panelId?: string
  title?: ReactNode
  icon?: ElementType
  iconClassName?: string
  menuItems?: PanelMenuItem[]
  headerRight?: ReactNode
  headerExtra?: ReactNode
  summary?: string
  badge?: string | number
  priority?: PanelPriority
  href?: string
  children: ReactNode
  className?: string
  defaultOpen?: boolean
  padding?: string
  rounded?: string
  collapsible?: boolean
  shadow?: boolean
  borderless?: boolean
  flush?: boolean
}

export function PanelCard({
  panelId,
  title,
  icon: Icon,
  iconClassName = 'text-violet-600',
  menuItems,
  headerRight,
  headerExtra,
  summary,
  badge,
  priority = 'primary',
  href,
  children,
  className = '',
  defaultOpen,
  padding = 'px-4 pb-4 sm:px-5 sm:pb-5 pt-3',
  rounded = 'rounded-2xl',
  collapsible = true,
  shadow = true,
  borderless = false,
  flush = false,
}: PanelCardProps) {
  const persisted = usePanelSection(panelId, priority, defaultOpen)
  const [localOpen, setLocalOpen] = useState(defaultOpen ?? priority !== 'secondary')
  const open = panelId ? persisted.open : localOpen

  const toggle = () => {
    if (panelId) persisted.toggle()
    else setLocalOpen(o => !o)
  }

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

  const contentPadding = flush ? '' : padding

  const contentOpen = !collapsible || open

  return (
    <section
      className={`${bgClass} ${rounded} ${borderClass} ${shadowClass} overflow-hidden ${className}`}
      data-panel-id={panelId}
    >
      <div className="flex items-stretch min-h-[3rem]">
        <button
          type="button"
          onClick={collapsible ? toggle : undefined}
          disabled={!collapsible}
          aria-expanded={contentOpen}
          aria-controls={panelId ? `panel-content-${panelId}` : undefined}
          className="flex flex-1 items-center gap-2.5 min-w-0 px-4 py-3 sm:px-5 text-left hover:bg-gray-50/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 disabled:cursor-default disabled:hover:bg-transparent"
        >
          {Icon && <Icon size={16} className={`${iconClassName} shrink-0`} />}
          <span className="flex-1 min-w-0">
            {title && (
              typeof title === 'string'
                ? <span className="block text-sm font-bold text-gray-800 truncate">{title}</span>
                : title
            )}
            {!contentOpen && summary && (
              <span className="block text-xs text-gray-400 truncate mt-0.5">{summary}</span>
            )}
          </span>
          {headerExtra}
          {badge !== undefined && badge !== '' && (
            <span className="shrink-0 text-xs font-semibold tabular-nums bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {headerRight}
          {collapsible && (
            <ChevronDown
              size={16}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          )}
        </button>
        {href && (
          <Link
            href={href}
            onClick={e => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1 px-3 sm:px-4 text-xs text-violet-600 font-semibold border-l border-gray-100 hover:bg-violet-50/50 transition-colors"
          >
            Ver tudo
            <ArrowRight size={12} />
          </Link>
        )}
        {menuItems && menuItems.length > 0 && <PanelDropdown items={menuItems} />}
      </div>

      <div
        id={panelId ? `panel-content-${panelId}` : undefined}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${contentOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className={`${contentPadding} border-t border-gray-50`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
