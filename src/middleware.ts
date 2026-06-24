import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/onboarding']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Deixa rotas públicas e API passarem livres
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Quando Auth (Fase 2) estiver ativo, verificar sessão aqui.
  // Por ora, permite tudo — estrutura pronta para plugar Supabase Auth.
  const session = req.cookies.get('sb-access-token')?.value

  if (!session) {
    // Temporariamente comentado até Supabase ser configurado:
    // return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
