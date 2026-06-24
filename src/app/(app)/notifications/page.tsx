'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  body?: string | null
  href?: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(j => setItems(j.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAll: true }),
    })
    toast.success('Todas marcadas como lidas')
    load()
  }

  const unread = items.filter(n => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-violet-600" />
            Notificações
          </h2>
          <p className="text-gray-500 mt-1 text-sm">{unread} não lida(s)</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={markAllRead}><CheckCheck size={16} />Marcar todas</Button>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-400 text-sm">
          Nenhuma notificação ainda. Eventos de pedidos e empreendimentos aparecerão aqui.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 ${!n.read ? 'border-violet-200 bg-violet-50/30' : ''}`}>
              {n.href ? (
                <Link href={n.href} className="font-medium text-gray-900 hover:text-violet-600">{n.title}</Link>
              ) : (
                <p className="font-medium text-gray-900">{n.title}</p>
              )}
              {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
              <p className="text-xs text-gray-300 mt-1">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
