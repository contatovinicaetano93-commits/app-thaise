'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { PublicFloatingUI } from '@/components/layout/PublicFloatingUI'
import { BRAND } from '@/lib/brand'
import { toast } from 'sonner'
import { PublicLegalFooter } from '@/components/legal/PublicLegalFooter'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (sessionExpired) toast.error('Sessão expirada — entre novamente com e-mail e senha')
  }, [sessionExpired])

  async function handleForgotPassword() {
    if (!form.email) {
      toast.error('Digite seu e-mail acima primeiro')
      return
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return

    setResetting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) throw error
      toast.success('Link de redefinição enviado — verifique seu e-mail')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar link')
    } finally {
      setResetting(false)
    }
  }

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
      toast.success('Acesso autorizado')
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="min-h-screen flex">
      {/* Painel editorial — Obsidiana */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 lg:p-16"
        style={{ background: 'var(--estlar-obsidian)' }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)]">
            {BRAND.name}
          </p>
          <p className="text-sm text-[var(--estlar-sand)] mt-1 tracking-wide">{BRAND.subtitle}</p>
        </div>

        <div className="max-w-md">
          <blockquote className="font-display text-[1.65rem] font-light text-[var(--estlar-linen)] leading-snug tracking-wide">
            &ldquo;{BRAND.manifesto}&rdquo;
          </blockquote>
          <p className="mt-8 text-sm text-[var(--estlar-titanium)] tracking-wide">
            {BRAND.founder}
          </p>
          <p className="text-xs text-[var(--estlar-wine-light)] mt-1 tracking-wider">
            {BRAND.tagline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BRAND.valueCycles.map(label => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[11px] text-[var(--estlar-titanium)] tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário — Areia / Linho */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'var(--background)' }}
      >
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-10 lg:hidden">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)]">
              {BRAND.name}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">{BRAND.subtitle}</p>
          </div>

          <h1 className="text-2xl font-light text-gray-900 tracking-wide mb-1">Acesso ao Hub</h1>
          <p className="text-sm text-[var(--estlar-titanium)] mb-2">
            Área privada · Gestores, clientes e fornecedores
          </p>
          <p className="text-xs text-gray-500 mb-8 leading-relaxed">
            Clientes e fornecedores recebem login e senha da Estlar. Não há cadastro público — use as credenciais enviadas.
          </p>

          {sessionExpired && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sua sessão expirou. Faça login novamente.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail institucional
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--estlar-wine)]/40 focus:border-[var(--estlar-wine)]"
              />
            </div>
            <PasswordInput
              label="Senha de acesso"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-xs font-medium disabled:opacity-50 transition-colors"
                style={{ color: 'var(--estlar-wine)' }}
              >
                {resetting ? 'Enviando…' : 'Recuperar acesso'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 disabled:opacity-60 text-white font-medium rounded-xl text-sm mt-2 transition-colors hover:opacity-95"
              style={{ background: 'var(--estlar-wine)' }}
            >
              {loading ? 'Entrando…' : 'Entrar no Hub'}
            </button>
          </form>

          <PublicLegalFooter className="mt-8" />
        </div>
      </div>
    </div>
    <PublicFloatingUI />
    </>
  )
}
