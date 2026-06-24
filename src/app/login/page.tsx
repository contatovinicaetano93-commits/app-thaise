'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Layers } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Auth será conectado na Fase 2 — por ora redireciona direto
    await new Promise(r => setTimeout(r, 800))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* Painel esquerdo — identidade */}
      <div className="hidden lg:flex w-1/2 bg-[#1a1033] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">Plataforma Thaise</span>
        </div>

        <div>
          <blockquote className="text-2xl font-medium text-white leading-snug mb-4">
            "O primeiro que fazemos sempre tem que ser case de resultado."
          </blockquote>
          <p className="text-violet-300 text-sm">Thaise Resende · Fundadora</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { n: '0', l: 'Fornecedores' },
            { n: '0', l: 'Clientes' },
            { n: '0', l: 'Pedidos' },
          ].map(({ n, l }) => (
            <div key={l} className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{n}</p>
              <p className="text-xs text-violet-300 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f7f5]">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">Plataforma Thaise</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vinda de volta</h1>
          <p className="text-sm text-gray-500 mb-8">Entre com seu email e senha.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="thaise@empresa.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8">
            Plataforma privada · Thaise Resende © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
