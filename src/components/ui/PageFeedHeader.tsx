'use client'

import type { ElementType, ReactNode } from 'react'
import { PanelDropdown, type PanelMenuItem } from '@/components/ui/PanelCard'

interface PageFeedHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ElementType
  menuItems?: PanelMenuItem[]
  menuLabel?: string
  className?: string
}

export function PageFeedHeader({
  title,
  subtitle,
  icon: Icon,
  menuItems,
  menuLabel = 'Ações rápidas',
  className = 'mb-6',
}: PageFeedHeaderProps) {
  return (
    <div className={`min-w-0 max-w-[calc(100%-6rem)] ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        {Icon && <Icon size={22} className="text-violet-600 shrink-0" />}
        <span className="truncate">{title}</span>
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        {menuItems && menuItems.length > 0 && (
          <PanelDropdown items={menuItems} variant="button" label={menuLabel} />
        )}
      </div>
    </div>
  )
}
