import { createServiceClient } from '@/lib/supabase-server'

export async function dispatchWebhooks(event: string, payload: Record<string, unknown>) {
  try {
    const db = createServiceClient()
    const { data: hooks } = await db.from('webhooks').select('*').eq('active', true) as {
      data: Array<{ id: string; url: string; events: string[]; secret: string }> | null
    }

    for (const hook of hooks ?? []) {
      if (!hook.events.includes(event) && !hook.events.includes('*')) continue
      fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': hook.secret,
          'X-Event': event,
        },
        body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      }).catch(err => console.error('[webhook]', hook.url, err))
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
