'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserPlus, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PageFeedHeader } from '@/components/ui/PageFeedHeader'
import { PanelCard } from '@/components/ui/PanelCard'
import { ListSkeleton } from '@/components/ui/EmptyState'
import { InviteUserForm, roleBadge } from '@/components/users/InviteUserForm'
import { usersApi } from '@/lib/api'
import type { AppUser } from '@/lib/api'
import { toast } from 'sonner'

function UsersPageContent() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await usersApi.list())
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (searchParams.get('supplier_id') || searchParams.get('client_id')) {
      setModalOpen(true)
    }
  }, [searchParams])

  return (
    <div className="space-y-4 animate-fade-in">
      <PageFeedHeader
        title="Convidar usuário"
        icon={UserPlus}
        subtitle="Crie logins de fornecedor e cliente sem abrir o Supabase"
        menuItems={[
          { label: 'Novo login', onClick: () => setModalOpen(true) },
          { label: 'Fornecedores', href: '/suppliers' },
          { label: 'Clientes', href: '/clients' },
        ]}
      />

      <PanelCard
        panelId="invite-help"
        title="Como funciona"
        icon={Users}
        collapsible={false}
        summary="Cadastre fornecedor/cliente → crie o login → envie e-mail e senha"
      >
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Cadastre o <strong>fornecedor</strong> ou <strong>cliente</strong> nas telas respectivas.</li>
          <li>Clique em <strong>Criar login</strong> e vincule à pessoa certa.</li>
          <li>Envie o link <strong>/login</strong> com e-mail e senha inicial.</li>
          <li>A pessoa entra direto no portal dela — sem cadastro público.</li>
        </ol>
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
            <p className="font-semibold text-indigo-800">Fornecedor vê</p>
            <p className="text-indigo-700/90 mt-1">Catálogo · Pedidos aprovados · Notificações</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <p className="font-semibold text-emerald-800">Cliente vê</p>
            <p className="text-emerald-700/90 mt-1">Empreendimentos · Pedidos · Notificações</p>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        panelId="users-list"
        title="Usuários da plataforma"
        icon={Users}
        badge={users.length || undefined}
        summary={`${users.length} login(s) cadastrado(s)`}
        menuItems={[{ label: 'Novo login', onClick: () => setModalOpen(true) }]}
      >
        {loading ? (
          <ListSkeleton rows={3} height="h-12" />
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nenhum usuário ainda. Crie o primeiro login.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {roleBadge(u.role)}
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Criar login de acesso">
        <InviteUserForm
          onSuccess={() => {
            setModalOpen(false)
            void load()
          }}
        />
      </Modal>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} height="h-14" />}>
      <UsersPageContent />
    </Suspense>
  )
}
