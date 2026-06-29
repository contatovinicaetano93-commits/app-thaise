'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Users, Package, ShoppingCart, Check, ArrowRight, Building2, Receipt, Kanban } from 'lucide-react'
import { isSimpleMode } from '@/lib/app-mode'

const GESTOR_STEPS_FULL = [
  { icon: Package, color: 'bg-stone-100 text-stone-800', title: 'Bem-vinda ao Hub Estlar', desc: 'Inteligência para curadoria de ativos, empreendimentos e consolidação patrimonial.', cta: 'Começar' },
  { icon: Kanban, color: 'bg-violet-100 text-violet-600', title: 'Pipeline comercial', desc: 'Leads do intake → briefing → proposta → Obra Fechada → empreendimento Fase A.', cta: 'Entendido', action: '/pipeline', actionLabel: 'Ver pipeline →' },
  { icon: Truck, color: 'bg-indigo-100 text-indigo-600', title: 'Homologue fornecedores', desc: 'Fornecedores pendentes passam por curadoria antes de entrar no catálogo.', cta: 'Entendido', action: '/suppliers?tab=homologacao', actionLabel: 'Ver fila →' },
  { icon: Users, color: 'bg-emerald-100 text-emerald-600', title: 'Clientes e empreendimentos', desc: 'Cada empreendimento exige cliente — jornada A→F com checklist.', cta: 'Entendido', action: '/projects', actionLabel: 'Empreendimentos →' },
  { icon: ShoppingCart, color: 'bg-rose-100 text-rose-600', title: 'Pronto!', desc: 'Use o assistente ✨ e o card "Próximo passo" no dashboard.', cta: 'Ir para o Dashboard' },
]

const GESTOR_STEPS_SIMPLE = [
  {
    icon: Package,
    color: 'bg-stone-100 text-stone-800',
    title: 'Hub Estlar — fluxo da obra',
    desc: 'Obra → homologar fornecedor → pedir SKU → montar orçamento → cliente aprova → gerar pedidos.',
    cta: 'Entendido',
  },
  {
    icon: Building2,
    color: 'bg-violet-100 text-violet-600',
    title: 'Comece pela obra',
    desc: 'Cadastre cliente e obra, defina as fases e o % de progresso. Libere o portal antes de enviar orçamento.',
    cta: 'Entendido',
    action: '/projects',
    actionLabel: 'Ir para Obras →',
  },
  {
    icon: Receipt,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Próximo passo no dashboard',
    desc: 'O card "Próximo passo" conduz você em cada etapa — homologação, SKU, orçamento, pedidos.',
    cta: 'Ir para o Dashboard',
  },
]

const FORNECEDOR_STEPS = [
  { icon: Package, color: 'bg-amber-100 text-amber-600', title: 'Portal Fornecedor', desc: 'A Estlar pede SKUs — você cadastra produtos. Pedidos aparecem em Meus pedidos.', cta: 'Começar' },
  { icon: Package, color: 'bg-violet-100 text-violet-600', title: 'SKUs solicitados', desc: 'Quando a Estlar pedir um SKU, cadastre o produto aqui.', cta: 'Ver SKUs', action: '/sku-requests' },
  { icon: ShoppingCart, color: 'bg-rose-100 text-rose-600', title: 'Pedidos', desc: 'Separe os produtos quando receber notificação de pedido.', cta: 'Ver pedidos', action: '/orders' },
]

const CLIENTE_STEPS = [
  { icon: Package, color: 'bg-stone-100 text-stone-700', title: 'Portal do Cliente', desc: 'Acompanhe sua obra, aprove orçamentos e veja o Relatório 360 da Estlar.', cta: 'Começar' },
  { icon: Receipt, color: 'bg-violet-100 text-violet-700', title: 'Aprovar orçamentos', desc: 'Quando a Estlar enviar um orçamento, você aprova ou rejeita em Meus orçamentos.', cta: 'Entendido', action: '/quotes', actionLabel: 'Meus orçamentos →' },
  { icon: Users, color: 'bg-emerald-100 text-emerald-600', title: 'Minha obra', desc: 'Veja o progresso % e as fases customizadas do seu empreendimento.', cta: 'Ver obra', action: '/projects' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'gestor' | 'fornecedor' | 'cliente'>('gestor')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(j => {
        const r = j.data?.profile?.role
        if (r === 'fornecedor' || r === 'cliente') setRole(r)
      })
      .catch(() => {})
  }, [])

  const GESTOR_STEPS = isSimpleMode() ? GESTOR_STEPS_SIMPLE : GESTOR_STEPS_FULL
  const STEPS = role === 'fornecedor' ? FORNECEDOR_STEPS : role === 'cliente' ? CLIENTE_STEPS : GESTOR_STEPS
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function finish() {
    fetch('/api/auth/onboarding', { method: 'POST', credentials: 'include' })
      .catch(() => {})
    localStorage.setItem('onboarding_done', '1')
    router.push('/dashboard')
  }

  function next() {
    if (isLast) {
      finish()
      return
    }
    setStep(s => s + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex gap-1.5 mb-6 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-8 bg-violet-600' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>
        <div key={step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
          <div className={`w-14 h-14 rounded-2xl ${current.color} flex items-center justify-center mb-5`}>
            <Icon size={26} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{current.desc}</p>
          {'action' in current && current.action && (
            <button
              onClick={() => router.push(current.action!)}
              className="w-full mb-3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl text-sm transition-colors"
            >
              {String('actionLabel' in current ? current.actionLabel : 'Ir agora →')}
            </button>
          )}
          <button onClick={next} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {isLast ? <><Check size={16} />{current.cta}</> : <>{current.cta}<ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}