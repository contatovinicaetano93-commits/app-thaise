import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { clearSupabaseAuthCookies, hasSupabaseAuthCookie } from '@/lib/supabase/auth-cookies'
import { canAccessRoute, type UserRole } from '@/lib/auth/roles'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'
import { rateLimitAsync } from '@/lib/rate-limit'

const PUBLIC_PATHS = ['/login', '/onboarding', '/privacidade', '/termos', '/auth/reset-password', '/auth/callback']

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/health',
  '/api/v1/health',
  '/api/cron/',
]

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let rateRemaining: number | undefined

  if (pathname.startsWith('/api/') && !isPublicApi(pathname)) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
    const { ok: allowed, remaining } = await rateLimitAsync(`api:${ip}`, 120)
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Muitas requisições — tente novamente em 1 minuto' }, { status: 429 })
    }
    rateRemaining = remaining
  }

  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    const res = NextResponse.next({ request: req })
    if (rateRemaining !== undefined) res.headers.set('X-RateLimit-Remaining', String(rateRemaining))
    return res
  }

  const { supabase, response } = createMiddlewareClient(req)
  if (!supabase) return response

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic =
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    isPublicApi(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

  const staleSession = !user && hasSupabaseAuthCookie(req) && !isPublic

  if (staleSession) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json(
        { ok: false, error: 'Sessão expirada — faça login novamente' },
        { status: 401 },
      )
      clearSupabaseAuthCookies(res, req)
      return res
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('session', 'expired')
    const res = NextResponse.redirect(loginUrl)
    clearSupabaseAuthCookies(res, req)
    return res
  }

  if (!user && pathname.startsWith('/api/') && !isPublicApi(pathname)) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  if (!user && !isPublic && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (user && !isPublic && !pathname.startsWith('/api/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed_at, supplier_id, client_id')
      .eq('id', user.id)
      .single()

    if (!profile?.role && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    if (profile?.role && !profile.onboarding_completed_at && profile.role === 'gestor' && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    const role = profile?.role as UserRole | undefined
    if (role && !canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  if (rateRemaining !== undefined) response.headers.set('X-RateLimit-Remaining', String(rateRemaining))
  return response
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico).*)'],
}
