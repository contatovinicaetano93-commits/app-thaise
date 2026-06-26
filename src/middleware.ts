import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { canAccessRoute, type UserRole } from '@/lib/auth/roles'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'
import { rateLimit } from '@/lib/rate-limit'

const PUBLIC_PATHS = ['/login', '/onboarding', '/intake']

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/health',
  '/api/v1/health',
  '/api/intake',
  '/api/cron/',
  '/api/openapi',
]

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  let rateRemaining: number | undefined

  if (pathname.startsWith('/api/') && !isPublicApi(pathname)) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
    const { ok: allowed, remaining } = rateLimit(ip, 120)
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
      .select('role')
      .eq('id', user.id)
      .single()

    // Se perfil sem role ainda não foi configurado, deixa passar com role padrão
    // (evita loop infinito onboarding → dashboard → onboarding)
    const role = (profile?.role ?? 'gestor') as UserRole
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  if (rateRemaining !== undefined) response.headers.set('X-RateLimit-Remaining', String(rateRemaining))
  return response
}

export const config = {
  matcher: ['/((?!monitoring|_next/static|_next/image|favicon.ico).*)'],
}
