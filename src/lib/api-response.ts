import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type ApiResponse<T> =
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: string; details?: unknown }

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data, ...(meta ? { meta } : {}) }, { status })
}

export function err(message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error: message, ...(details ? { details } : {}) }, { status })
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return err('Dados inválidos', 422, e.flatten().fieldErrors)
  }
  console.error('[API Error]', e)
  return err('Erro interno do servidor', 500)
}
