import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return { supabase: null, response: supabaseResponse }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  return { supabase, response: supabaseResponse }
}
