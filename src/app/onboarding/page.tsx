'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Users, Package, ShoppingCart, Check, ArrowRight, Layers } from 'lucide-react'

const GESTOR_STEPS = [
  { icon: Layers, color: 'bg-violet-100 text-violet-600', title: 'Bem-vinda, Gestora', desc: 'Centralize fornecedores, empreendimentos e pedidos. O mapa SIPOC guia cada etapa.', cta: 'Começar' },
  { icon: Truck, color: 'bg-indigo-100 text-indigo-600', title: 'Homologue fornecedores', desc: 'Fornecedores pendentes passam por curadoria antes de entrar no catálogo.', cta: 'Entendido', action: '/pending-suppliers', actionLabel: 'Ver fila →' },
  { icon: Users, color: 'bg-emerald-100 text-emerald-600', title: 'Clientes e empreendimentos', desc: 'Cada empreendimento exige cliente — jornada A→F com checklist.', cta: 'Entendido', action: '/projects', actionLabel: 'Empreendimentos →' },
  { icon: ShoppingCart, color: 'bg-rose-100 text-rose-600', title: 'Pronto!', desc: 'Use o assistente ✨ e o dashboard para saber o próximo passo.', cta: 'Ir para o Dashboard' },
]

const FORNECEDOR_STEPS = [
  { icon: Package, color: 'bg-amber-100 text-amber-600', title: 'Portal Fornecedor', desc: 'Gerencie seu catálogo e acompanhe pedidos aprovados.', cta: 'Começar' },
  { icon: ShoppingCart, color: 'bg-rose-100 text-rose-600', title: 'Pedidos', desc: 'Você verá apenas os pedidos vinculados ao seu fornecedor.', cta: 'Ver pedidos', action: '/orders' },
]

const CLIENTE_STEPS = [
  { icon: Layers, color: 'bg-violet-100 text-violet-600', title: 'Portal Cliente', desc: 'Acompanhe seus empreendimentos e pedidos em tempo real.', cta: 'Começar' },
  { icon: Users, color: 'bg-emerald-100 text-emerald-600', title: 'Empreendimentos', desc: 'Veja em qual fase A–F está cada projeto.', cta: 'Ver projetos', action: '/projects' },
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

  const STEPS = role === 'fornecedor' ? FORNECEDOR_STEPS : role === 'cliente' ? CLIENTE_STEPS : GESTOR_STEPS
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function next() {
    if (isLast) {
      localStorage.setItem('onboarding_done', '1')
      router.push('/dashboard')
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
