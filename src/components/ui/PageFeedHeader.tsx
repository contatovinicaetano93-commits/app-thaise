'use client'

import type { ElementType, ReactNode } from 'react'
import { PanelDropdown, type PanelMenuItem } from '@/components/ui/PanelCard'

interface PageFeedHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ElementType
  menuItems?: PanelMenuItem[]
  className?: string
}

export function PageFeedHeader({ title, subtitle, icon: Icon, menuItems, className = 'mb-6' }: PageFeedHeaderProps) {
  return (
    <div className={`min-w-0 max-w-[calc(100%-6rem)] ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
        {Icon && <Icon size={22} className="text-violet-600 shrink-0" />}
        <span className="truncate">{title}</span>
        {menuItems && menuItems.length > 0 && (
          <PanelDropdown items={menuItems} compact />
        )}
      </h2>
      {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
    </div>
  )
}
