import type { NextRequest, NextResponse } from 'next/server'

export function hasSupabaseAuthCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some(c =>
    c.name.includes('-auth-token') || (c.name.startsWith('sb-') && c.value.length > 0),
  )
}

export function clearSupabaseAuthCookies(res: NextResponse, req: NextRequest) {
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.includes('-auth-token') || cookie.name.startsWith('sb-')) {
      res.cookies.delete(cookie.name)
    }
  }
}
