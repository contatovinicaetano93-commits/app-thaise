'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Building2, Users, Truck, Receipt, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { isSimpleMode } from '@/lib/app-mode'

const STEPS_V2 = [
  { icon: Users, title: '1. Cliente', desc: 'Registre o cliente da obra.', href: '/clients' },
  { icon: Building2, title: '2. Obra', desc: 'Crie a obra, defina fases e % de progresso.', href: '/projects' },
  { icon: Truck, title: '3. Homologar fornecedor', desc: 'Aprove fornecedores na fila de homologação.', href: '/pending-suppliers' },
  { icon: Package, title: '4. Pedir SKU', desc: 'Solicite produtos ao fornecedor homologado.', href: '/sku-requests' },
  { icon: Receipt, title: '5. Orçamento', desc: 'Monte o orçamento e envie ao cliente para aprovação.', href: '/quotes' },
]

const STEPS_LEGACY = [
  { icon: Truck, title: '1. Fornecedor', desc: 'Cadastre e homologue um fornecedor curado.', href: '/suppliers' },
  { icon: Users, title: '2. Cliente', desc: 'Registre o cliente do empreendimento.', href: '/clients' },
  { icon: Building2, title: '3. Empreendimento', desc: 'Crie o projeto na Fase A com checklist.', href: '/projects' },
  { icon: Receipt, title: '4. Orçamento / Pedido', desc: 'Monte orçamento ou crie pedido direto.', href: '/quotes' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function FirstProjectWizard({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const STEPS = isSimpleMode() ? STEPS_V2 : STEPS_LEGACY

  if (!open) return null

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-violet-600 uppercase">Primeira obra — fluxo Estlar</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className={`p-3 rounded-xl bg-violet-50 w-fit mb-4`}>
          <Icon size={22} className="text-violet-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h3>
        <p className="text-sm text-gray-500 mb-6">{current.desc}</p>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>Voltar</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" onClick={() => setStep(s => s + 1)}>Próximo</Button>
          ) : (
            <Link href={current.href} className="flex-1" onClick={onClose}>
              <Button className="w-full">Começar agora</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
