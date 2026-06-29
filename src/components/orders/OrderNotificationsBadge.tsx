'use client'

import { MessageCircle, Mail, Bell, AlertCircle } from 'lucide-react'
import type { OrderNotificationRow } from '@/app/api/orders/notifications/route'

const CHANNEL_ICON = {
  whatsapp: MessageCircle,
  email: Mail,
  in_app: Bell,
}

const STATUS_LABEL = {
  sent: 'Enviado',
  stub: 'Link manual',
  failed: 'Falhou',
}

const STATUS_COLOR = {
  sent: 'text-emerald-600 bg-emerald-50',
  stub: 'text-amber-700 bg-amber-50',
  failed: 'text-red-600 bg-red-50',
}

interface Props {
  notifications?: OrderNotificationRow[]
}

export function OrderNotificationsBadge({ notifications }: Props) {
  if (!notifications?.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-gray-500 mb-2">Notificações ao fornecedor</p>
      <div className="flex flex-wrap gap-2">
        {notifications.map((n, i) => {
          const Icon = CHANNEL_ICON[n.channel] ?? Bell
          const color = STATUS_COLOR[n.status] ?? 'text-gray-600 bg-gray-50'
          const waLink = n.metadata?.wa_link as string | undefined
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${color}`}
              title={n.error ?? undefined}
            >
              <Icon size={12} />
              {n.channel === 'whatsapp' ? 'WhatsApp' : n.channel === 'email' ? 'E-mail' : 'In-app'}
              {' · '}
              {STATUS_LABEL[n.status]}
              {n.status === 'failed' && <AlertCircle size={10} />}
              {waLink && n.status === 'stub' && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  abrir
                </a>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
