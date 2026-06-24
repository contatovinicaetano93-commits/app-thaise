import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
      <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className={iconClass} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
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
