'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock } from 'lucide-react'
import { LogoutButton } from '@/components/layout/LogoutButton'

function Content() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'Seu acesso ao portal ainda não foi liberado pela Estlar.'

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-5">
          <Clock size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso pendente</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{reason}</p>
        <p className="text-xs text-gray-400 mb-6">
          Fornecedores entram após homologação e convite. Clientes entram quando a obra for liberada no portal.
        </p>
        <LogoutButton variant="prominent" className="w-full justify-center" />
      </div>
    </div>
  )
}

export default function AcessoPendentePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f7f5]" />}>
      <Content />
    </Suspense>
  )
}
