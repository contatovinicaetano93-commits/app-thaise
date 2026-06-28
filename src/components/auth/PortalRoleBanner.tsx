'use client'

import { Building2, Package, ShoppingCart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_LABELS } from '@/lib/auth/roles'

export function PortalRoleBanner() {
  const { role, profile, loading, isGestor } = useAuth()
  if (loading || isGestor || !profile || !role) return null

  const isFornecedor = role === 'fornecedor'

  return (
    <div
      className="mb-4 rounded-2xl border px-5 py-4"
      style={{
        borderColor: isFornecedor ? 'color-mix(in srgb, #6366f1 25%, transparent)' : 'color-mix(in srgb, var(--estlar-wine) 25%, transparent)',
        background: isFornecedor ? '#eef2ff' : 'color-mix(in srgb, var(--estlar-sand) 40%, white)',
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-1">
        {ROLE_LABELS[role]}
      </p>
      <h2 className="text-base font-semibold text-gray-900">
        {isFornecedor ? 'Portal do Fornecedor' : 'Refúgio Digital — Cliente'}
      </h2>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
        {isFornecedor
          ? 'Você entrou com login e senha enviados pela Estlar. Aqui você gerencia seu catálogo e acompanha pedidos aprovados.'
          : 'Você entrou com login e senha enviados pela Estlar. Aqui você acompanha seus empreendimentos e pedidos — leitura e transparência da jornada.'}
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {isFornecedor ? (
          <>
            <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <ShoppingCart size={14} /> Meus pedidos <ArrowRight size={12} />
            </Link>
            <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Package size={14} /> Meu catálogo <ArrowRight size={12} />
            </Link>
          </>
        ) : (
          <>
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50">
              <Building2 size={14} /> Meus empreendimentos <ArrowRight size={12} />
            </Link>
            <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50">
              <ShoppingCart size={14} /> Meus pedidos <ArrowRight size={12} />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
