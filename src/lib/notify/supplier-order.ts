import { createServiceClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/notify/email'
import { sendWhatsApp, getEstlarWhatsAppNumber } from '@/lib/notify/whatsapp'
import { notifyUser } from '@/lib/webhooks/dispatch'

export interface SeparationNoticeResult {
  orderId: string
  whatsapp: Awaited<ReturnType<typeof sendWhatsApp>>
  email: Awaited<ReturnType<typeof sendEmail>>
  inApp: boolean
}

async function logNotification(
  orderId: string,
  channel: 'whatsapp' | 'email' | 'in_app',
  status: 'sent' | 'failed' | 'stub',
  recipient: string,
  message: string,
  error?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const db = createServiceClient()
    await db.from('order_notifications').insert({
      order_id: orderId,
      channel,
      status,
      recipient,
      message,
      error: error ?? null,
      metadata: metadata ?? {},
    } as never)
  } catch {
    // tabela pode não existir ainda — não bloqueia o fluxo
  }
}

export async function notifySupplierSeparation(orderId: string): Promise<SeparationNoticeResult> {
  const db = createServiceClient()

  const { data: order } = await db
    .from('orders')
    .select(`
      id, quantity, notes,
      product:products(name, unit),
      supplier:suppliers(id, name, contact_phone, contact_email),
      project:projects(name),
      client:clients(name)
    `)
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Pedido não encontrado')

  const row = order as {
    id: string
    quantity: number
    notes: string | null
    product: { name: string; unit: string } | null
    supplier: { id: string; name: string; contact_phone: string; contact_email: string } | null
    project: { name: string } | null
    client: { name: string } | null
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app-thaise.vercel.app'
  const productName = row.product?.name ?? 'Produto'
  const obra = row.project?.name ?? 'Obra'
  const supplier = row.supplier

  const message = [
    `Estlar — Pedido #${orderId.slice(0, 8).toUpperCase()}`,
    `Obra: ${obra}`,
    `Cliente: ${row.client?.name ?? '—'}`,
    `Separar: ${productName} × ${row.quantity} ${row.product?.unit ?? 'un'}`,
    row.notes ? `Obs: ${row.notes}` : '',
    `Acesse: ${appUrl}/orders`,
  ].filter(Boolean).join('\n')

  const whatsapp = supplier?.contact_phone
    ? await sendWhatsApp(supplier.contact_phone, message)
    : { sent: false, provider: 'stub' as const, sent_at: new Date().toISOString(), error: 'Fornecedor sem telefone' }

  await logNotification(
    orderId,
    'whatsapp',
    whatsapp.sent ? 'sent' : whatsapp.wa_link ? 'stub' : 'failed',
    supplier?.contact_phone ?? '',
    message,
    whatsapp.error,
    { wa_link: whatsapp.wa_link, from: getEstlarWhatsAppNumber() },
  )

  const emailBody = [
    message,
    '',
    whatsapp.wa_link ? `WhatsApp (link): ${whatsapp.wa_link}` : '',
    whatsapp.error ? `WhatsApp API: ${whatsapp.error}` : '',
  ].filter(Boolean).join('\n')

  const email = supplier?.contact_email
    ? await sendEmail({
        to: supplier.contact_email,
        subject: `Estlar — Separar produto · ${obra}`,
        body: emailBody,
      })
    : { sent: false, provider: 'stub' as const, sent_at: new Date().toISOString(), error: 'Sem e-mail' }

  await logNotification(
    orderId,
    'email',
    email.sent ? 'sent' : 'failed',
    supplier?.contact_email ?? '',
    emailBody,
    email.error,
  )

  let inApp = false
  if (supplier?.id) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id')
      .eq('supplier_id', supplier.id)
      .eq('role', 'fornecedor') as { data: Array<{ id: string }> | null }

    for (const p of profiles ?? []) {
      await notifyUser(
        p.id,
        'Separar produto para a Estlar',
        `${productName} × ${row.quantity} — ${obra}`,
        '/orders',
      )
      inApp = true
    }
    if (inApp) {
      await logNotification(orderId, 'in_app', 'sent', supplier.id, message)
    }
  }

  return { orderId, whatsapp, email, inApp }
}
