import { createServiceClient } from '@/lib/supabase-server'

const MAX_ATTEMPTS = 3
const TIMEOUT_MS = 8_000

async function deliverWebhook(
  hook: { id: string; url: string; secret: string },
  event: string,
  payload: Record<string, unknown>,
  attempt: number,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': hook.secret,
        'X-Event': event,
      },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (res.ok) return { success: true, statusCode: res.status }
    return { success: false, statusCode: res.status, error: `HTTP ${res.status}` }
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { success: false, error: msg }
  }
}

async function logDelivery(
  webhookId: string,
  event: string,
  url: string,
  attempt: number,
  result: { success: boolean; statusCode?: number; error?: string },
  payload: Record<string, unknown>,
) {
  try {
    const db = createServiceClient()
    await db.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event,
      url,
      attempt,
      success: result.success,
      status_code: result.statusCode ?? null,
      error: result.error ?? null,
      payload,
    } as never)
  } catch (e) {
    console.error('[webhook_deliveries]', e)
  }
}

export async function dispatchWebhooks(event: string, payload: Record<string, unknown>) {
  try {
    const db = createServiceClient()
    const { data: hooks } = await db.from('webhooks').select('*').eq('active', true) as {
      data: Array<{ id: string; url: string; events: string[]; secret: string }> | null
    }

    for (const hook of hooks ?? []) {
      if (!hook.events.includes(event) && !hook.events.includes('*')) continue

      let lastResult: { success: boolean; statusCode?: number; error?: string } = { success: false, error: 'not attempted' }

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        lastResult = await deliverWebhook(hook, event, payload, attempt)
        await logDelivery(hook.id, event, hook.url, attempt, lastResult, payload)
        if (lastResult.success) break
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, attempt * 500))
        }
      }

      if (!lastResult.success) {
        console.error('[webhook] failed after retries', hook.url, lastResult.error)
      }
    }
  } catch (e) {
    console.error('[dispatchWebhooks]', e)
  }
}

export async function notifyUser(userId: string, title: string, body?: string, href?: string) {
  try {
    const db = createServiceClient()
    await db.from('notifications').insert({
      user_id: userId,
      title,
      body: body ?? null,
      href: href ?? null,
    } as never)
  } catch (e) {
    console.error('[notifications]', e)
  }
}
