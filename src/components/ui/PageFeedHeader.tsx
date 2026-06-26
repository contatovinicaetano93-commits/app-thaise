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
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {Icon && <Icon size={22} className="text-violet-600 shrink-0" />}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {menuItems && menuItems.length > 0 && <PanelDropdown items={menuItems} />}
    </div>
  )
}
