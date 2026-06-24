import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { canAccessRoute, type UserRole } from '@/lib/auth/roles'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

const PUBLIC_PATHS = ['/login', '/onboarding']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
    return NextResponse.next({ request: req })
  }

  const { supabase, response } = createMiddlewareClient(req)
  if (!supabase) return response

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic =
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

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

    const role = (profile?.role ?? 'gestor') as UserRole
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
