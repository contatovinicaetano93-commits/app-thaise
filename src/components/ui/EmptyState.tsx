import type { LucideIcon } from 'lucide-react'
import { PanelCard } from '@/components/ui/PanelCard'

interface Props {
  icon: LucideIcon
  iconClass?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, iconClass = 'text-violet-600', title, description, actionLabel, onAction }: Props) {
  return (
    <PanelCard
      title={title}
      icon={Icon}
      iconClassName={iconClass}
      padding="p-12"
      collapsible={false}
      menuItems={actionLabel && onAction ? [{ label: actionLabel, onClick: onAction }] : undefined}
    >
      <p className="text-sm text-gray-500 text-center">{description}</p>
    </PanelCard>
  )
}

export function ListSkeleton({ rows = 3, height = 'h-20' }: { rows?: number; height?: string }) {
  return (
    <div className="grid gap-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`bg-white rounded-xl border border-gray-100 p-5 animate-pulse ${height}`} />
      ))}
    </div>
  )
}
