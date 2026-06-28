'use client'

import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

export function IncompleteProfileBanner() {
  const { profile, role, loading } = useAuth()
  if (loading || !profile || !role) return null

  if (role === 'fornecedor' && !profile.supplier_id) {
    return (
      <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Conta incompleta</p>
          <p className="text-amber-800/90 mt-0.5">
            Seu usuário ainda não está vinculado a um fornecedor. Peça ao gestor para convidar você em Usuários.
          </p>
        </div>
      </div>
    )
  }

  if (role === 'cliente' && !profile.client_id) {
    return (
      <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Conta incompleta</p>
          <p className="text-amber-800/90 mt-0.5">
            Seu usuário ainda não está vinculado a um cliente. Peça ao gestor para convidar você após o fechamento comercial.
          </p>
        </div>
      </div>
    )
  }

  return null
}
