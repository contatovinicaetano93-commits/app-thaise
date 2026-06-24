'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Users, Package, ShoppingCart, Check, ArrowRight, Layers } from 'lucide-react'

const STEPS = [
  {
    icon: Layers,
    color: 'bg-violet-100 text-violet-600',
    title: 'Bem-vinda à sua plataforma',
    desc: 'Aqui você centraliza fornecedores, clientes e pedidos em um só lugar. Vamos configurar tudo em 4 passos rápidos.',
    cta: 'Começar',
  },
  {
    icon: Truck,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Cadastre seus fornecedores',
    desc: 'Adicione os fornecedores que você já trabalha. Cada um tem score, status e catálogo de produtos próprio.',
    cta: 'Entendido',
    action: '/suppliers',
    actionLabel: 'Adicionar agora →',
  },
  {
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Registre seus clientes',
    desc: 'Cadastre seus clientes com segmento e histórico. A plataforma vai mostrar quem precisa de atenção.',
    cta: 'Entendido',
    action: '/clients',
    actionLabel: 'Adicionar agora →',
  },
  {
    icon: Package,
    color: 'bg-amber-100 text-amber-600',
    title: 'Monte o catálogo',
    desc: 'Vincule produtos a cada fornecedor com preço e prazo. Na hora de criar um pedido, tudo estará pronto.',
    cta: 'Entendido',
    action: '/products',
    actionLabel: 'Ver catálogo →',
  },
  {
    icon: ShoppingCart,
    color: 'bg-rose-100 text-rose-600',
    title: 'Tudo pronto!',
    desc: 'Sua plataforma está configurada. Crie pedidos conectando clientes a produtos e acompanhe tudo pelo dashboard.',
    cta: 'Ir para o Dashboard',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function next() {
    if (isLast) {
      localStorage.setItem('onboarding_done', '1')
      router.push('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                i <= step ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div key={step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
          <div className={`inline-flex p-4 rounded-2xl ${current.color} mb-6`}>
            <Icon size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{current.desc}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={next}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {current.cta}
              {isLast ? <Check size={15} /> : <ArrowRight size={15} />}
            </button>

            {'action' in current && current.action && (
              <button
                onClick={() => router.push(current.action!)}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl text-sm transition-colors"
              >
                {current.actionLabel}
              </button>
            )}

            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-xs text-gray-400 hover:text-gray-600 text-center py-1"
              >
                ← Voltar
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Passo {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  )
}
