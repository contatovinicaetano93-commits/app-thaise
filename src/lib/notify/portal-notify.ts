import { createServiceClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/notify/email'
import { notifyUser } from '@/lib/webhooks/dispatch'

async function profilesForSupplier(supplierId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('profiles')
    .select('id')
    .eq('supplier_id', supplierId)
    .eq('role', 'fornecedor') as { data: Array<{ id: string }> | null }
  return data ?? []
}

async function profilesForClient(clientId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('profiles')
    .select('id')
    .eq('client_id', clientId)
    .eq('role', 'cliente') as { data: Array<{ id: string }> | null }
  return data ?? []
}

export async function notifySupplierUsers(
  supplierId: string,
  title: string,
  body: string,
  href: string,
) {
  const profiles = await profilesForSupplier(supplierId)
  for (const p of profiles) {
    await notifyUser(p.id, title, body, href)
  }
  return profiles.length
}

export async function notifyClientUsers(
  clientId: string,
  title: string,
  body: string,
  href: string,
) {
  const profiles = await profilesForClient(clientId)
  for (const p of profiles) {
    await notifyUser(p.id, title, body, href)
  }
  return profiles.length
}

export async function notifyClientEmail(clientId: string, subject: string, body: string) {
  const db = createServiceClient()
  const { data: client } = await db
    .from('clients')
    .select('email, name')
    .eq('id', clientId)
    .single() as { data: { email: string; name: string } | null }

  if (!client?.email) {
    return { sent: false, provider: 'stub' as const, sent_at: new Date().toISOString(), error: 'Cliente sem e-mail' }
  }

  return sendEmail({
    to: client.email,
    subject,
    body: `Olá, ${client.name}.\n\n${body}`,
  })
}
