'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Package, ShoppingCart, Check, ArrowRight, Building2, Receipt } from 'lucide-react'
import { toast } from 'sonner'

const GESTOR_STEPS = [
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
    desc: 'A obra é um container simples: vincule o cliente e acompanhe o progresso.',
    cta: 'Entendido',
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
  { icon: Package, color: 'bg-violet-100 text-violet-600', title: 'SKUs solicitados', desc: 'Quando a Estlar pedir um SKU, cadastre o produto aqui.', cta: 'Entendido' },
  { icon: ShoppingCart, color: 'bg-rose-100 text-rose-600', title: 'Pedidos', desc: 'Separe os produtos quando receber notificação de pedido.', cta: 'Ir para o Dashboard' },
]

const CLIENTE_STEPS = [
  { icon: Package, color: 'bg-stone-100 text-stone-700', title: 'Portal do Cliente', desc: 'Acompanhe sua obra, aprove orçamentos e veja o Relatório 360 da Estlar.', cta: 'Começar' },
  { icon: Receipt, color: 'bg-violet-100 text-violet-700', title: 'Aprovar orçamentos', desc: 'Quando a Estlar enviar um orçamento, você aprova ou rejeita em Meus orçamentos.', cta: 'Entendido' },
  { icon: Users, color: 'bg-emerald-100 text-emerald-600', title: 'Minha obra', desc: 'Veja o progresso % do seu empreendimento.', cta: 'Ir para o Dashboard' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'gestor' | 'fornecedor' | 'cliente'>('gestor')
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const profile = j.data?.profile
        const r = profile?.role
        if (r === 'fornecedor' || r === 'cliente') setRole(r)
        if (profile?.onboarding_completed_at) {
          router.replace('/dashboard')
        }
      })
      .catch(() => {})
  }, [router])

  const STEPS = role === 'fornecedor' ? FORNECEDOR_STEPS : role === 'cliente' ? CLIENTE_STEPS : GESTOR_STEPS
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  async function goToDashboard() {
    if (finishing) return
    setFinishing(true)
    localStorage.setItem('onboarding_done', '1')

    try {
      const res = await fetch('/api/auth/onboarding', { method: 'POST', credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.ok === false) {
        console.warn('onboarding POST failed', json)
        toast.message('Abrindo o hub')
      }
    } catch (e) {
      console.warn('onboarding POST error', e)
    }

    // Hard navigation: evita loop com cache do middleware/router
    window.location.href = '/dashboard'
  }

  function next() {
    if (isLast) {
      void goToDashboard()
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
          <button
            type="button"
            onClick={next}
            disabled={finishing}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {finishing ? (
              'Abrindo dashboard…'
            ) : isLast ? (
              <><Check size={16} />{current.cta}</>
            ) : (
              <>{current.cta}<ArrowRight size={16} /></>
            )}
          </button>
          {isLast && !finishing && (
            <button
              type="button"
              onClick={() => { window.location.href = '/dashboard' }}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-800"
            >
              Pular e ir ao dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
