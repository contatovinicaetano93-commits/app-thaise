'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { PublicLegalFooter } from '@/components/legal/PublicLegalFooter'
import { BRAND } from '@/lib/brand'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initSession() {
      try {
        const supabase = createClient()

        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          window.history.replaceState(null, '', window.location.pathname)
          if (!cancelled) setReady(true)
          return
        }

        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash
        if (hash) {
          const hashParams = new URLSearchParams(hash)
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error
            window.history.replaceState(null, '', window.location.pathname)
            if (!cancelled) setReady(true)
            return
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (!cancelled) setReady(true)
          return
        }

        toast.error('Link inválido ou expirado — solicite um novo e-mail de recuperação')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Não foi possível validar o link')
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void initSession()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Senha atualizada — bem-vindo(a) de volta')
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar senha')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      <div
        className="hidden lg:flex w-[42%] flex-col justify-between p-12 shrink-0"
        style={{ background: 'var(--estlar-obsidian)' }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)]">
            {BRAND.name}
          </p>
          <p className="text-sm text-[var(--estlar-sand)] mt-1">{BRAND.subtitle}</p>
        </div>
        <blockquote className="font-display text-[1.5rem] font-light text-[var(--estlar-linen)] leading-snug max-w-sm">
          Redefina sua senha para continuar no Hub com segurança.
        </blockquote>
        <p className="text-xs text-[var(--estlar-titanium)]">{BRAND.tagline}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)]">
              {BRAND.name}
            </p>
          </div>

          <h1 className="text-2xl font-light text-gray-900 tracking-wide mb-2">Nova senha</h1>
          <p className="text-sm text-[var(--estlar-titanium)] mb-8 leading-relaxed">
            Escolha uma senha forte com pelo menos 8 caracteres.
          </p>

          {checking ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm animate-pulse h-48" />
          ) : ready ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8 space-y-4 shadow-sm"
            >
              <PasswordInput
                label="Nova senha"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <PasswordInput
                label="Confirmar senha"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" loading={submitting} className="w-full !rounded-xl !py-3">
                Salvar nova senha
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm space-y-4">
              <p className="text-sm text-gray-600">
                O link de recuperação expirou ou já foi utilizado.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--estlar-wine)' }}
              >
                Voltar ao login
              </Link>
            </div>
          )}

          <PublicLegalFooter className="mt-8" />
        </div>
      </div>
    </div>
  )
}
