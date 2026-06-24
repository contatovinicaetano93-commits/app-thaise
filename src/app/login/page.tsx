'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
      router.push('/dashboard')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error
      toast.success('Bem-vinda!')
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-[#1a1033] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">Plataforma Thaise</span>
        </div>
        <div>
          <blockquote className="text-2xl font-medium text-white leading-snug mb-4">
            &ldquo;O primeiro que fazemos sempre tem que ser case de resultado.&rdquo;
          </blockquote>
          <p className="text-violet-300 text-sm">Thaise Resende · Fundadora</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['Fornecedores', 'Clientes', 'Pedidos'].map(l => (
            <div key={l} className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-violet-300 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#f8f7f5]">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900">Plataforma Thaise</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vinda de volta</h1>
          <p className="text-sm text-gray-500 mb-8">Gestor · Fornecedor · Cliente</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="thaise@empresa.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 pr-11"
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
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
