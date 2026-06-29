'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export interface PageTab {
  id: string
  label: string
  badge?: number
}

interface Props {
  tabs: PageTab[]
  param?: string
  className?: string
}

export function PageTabs({ tabs, param = 'tab', className }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get(param) ?? tabs[0]?.id

  function href(tabId: string) {
    const q = new URLSearchParams(searchParams.toString())
    if (tabId === tabs[0]?.id) q.delete(param)
    else q.set(param, tabId)
    const qs = q.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className={`flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl mb-4 ${className ?? ''}`}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <Link
            key={tab.id}
            href={href(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-white text-violet-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-600'}`}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
