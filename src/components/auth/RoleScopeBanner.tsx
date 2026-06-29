'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ROLE_CANON } from '@/lib/flow-roles'
import { isSimpleMode } from '@/lib/app-mode'

const GESTOR_LINKS_V2 = [
  { href: '/projects', label: 'Obras' },
  { href: '/sku-requests?new=1', label: 'Pedir SKU' },
  { href: '/quotes', label: 'Orçamentos' },
] as const

const GESTOR_LINKS_LEGACY = [
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/products', label: 'Catálogo curado' },
  { href: '/orders?new=1', label: 'Novo pedido' },
] as const

const FORNECEDOR_LINKS = [
  { href: '/products?new=1', label: 'Cadastrar produto' },
  { href: '/orders', label: 'Meus pedidos' },
] as const

const CLIENTE_LINKS = [
  { href: '/quotes', label: 'Meus orçamentos' },
  { href: '/projects', label: 'Minha obra' },
  { href: '/reports/weekly', label: 'Relatório 360' },
] as const

interface Props {
  /** Reservado — banner aparece só no dashboard via layout da página */
  dashboardOnly?: boolean
}

export function RoleScopeBanner(_props?: Props) {
  const { role, loading } = useAuth()
  if (loading || !role) return null

  const canon = ROLE_CANON[role]
  const gestorLinks = isSimpleMode() ? GESTOR_LINKS_V2 : GESTOR_LINKS_LEGACY
  const links = role === 'gestor' ? gestorLinks : role === 'fornecedor' ? FORNECEDOR_LINKS : CLIENTE_LINKS

  const isFornecedor = role === 'fornecedor'
  const isGestora = role === 'gestor'

  return (
    <div
      className="mb-4 rounded-2xl border px-5 py-4"
      style={{
        borderColor: isGestora
          ? 'color-mix(in srgb, var(--estlar-wine) 20%, transparent)'
          : isFornecedor
            ? 'color-mix(in srgb, #6366f1 25%, transparent)'
            : 'color-mix(in srgb, var(--estlar-wine) 25%, transparent)',
        background: isGestora
          ? 'color-mix(in srgb, var(--estlar-sand) 35%, white)'
          : isFornecedor
            ? '#eef2ff'
            : 'color-mix(in srgb, var(--estlar-sand) 40%, white)',
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-1">
        {canon.title}
      </p>
      <p className="text-sm text-gray-800 leading-relaxed">
        <span className="font-medium">{canon.does}</span>
      </p>
      <p className="text-xs text-gray-500 mt-1">{canon.doesNot}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
              href.includes('new=1') || (isGestora && !isSimpleMode() && href === '/pipeline')
                ? 'bg-[var(--estlar-wine)] text-white hover:bg-[var(--estlar-wine-light)]'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-violet-200'
            }`}
          >
            {label}
            <ArrowRight size={12} />
          </Link>
        ))}
      </div>
    </div>
  )
}
