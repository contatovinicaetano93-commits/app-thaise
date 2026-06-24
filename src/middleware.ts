import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { canAccessRoute, type UserRole } from '@/lib/auth/roles'

const PUBLIC_PATHS = ['/login', '/onboarding']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  let response = NextResponse.next({ request: req })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem Supabase configurado — modo dev aberto
  if (!url || !key) {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return response
    }
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

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
