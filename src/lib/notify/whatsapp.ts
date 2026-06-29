export interface WhatsAppResult {
  sent: boolean
  provider: 'evolution' | 'wa_link' | 'stub'
  sent_at: string
  wa_link?: string
  error?: string
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  if (digits.length >= 10) return `55${digits}`
  return digits
}

/** Número Estlar (instância / remetente) — +55 11 99345-5589 */
export function getEstlarWhatsAppNumber(): string {
  return (process.env.WHATSAPP_FROM_NUMBER ?? '5511993455589').replace(/\D/g, '')
}

export function buildWaMeLink(phone: string, text: string): string {
  const to = normalizePhone(phone)
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`
}

/**
 * Envia WhatsApp via Evolution API (se configurado).
 * Fallback: retorna link wa.me para envio manual.
 */
export async function sendWhatsApp(to: string, message: string): Promise<WhatsAppResult> {
  const sentAt = new Date().toISOString()
  const normalized = normalizePhone(to)
  const waLink = buildWaMeLink(normalized, message)

  const apiUrl = process.env.WHATSAPP_API_URL?.replace(/\/$/, '')
  const apiKey = process.env.WHATSAPP_API_KEY
  const instance = process.env.WHATSAPP_INSTANCE ?? 'estlar'

  if (apiUrl && apiKey) {
    try {
      const res = await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: normalized,
          textMessage: { text: message },
        }),
      })

      if (res.ok) {
        return { sent: true, provider: 'evolution', sent_at: sentAt, wa_link: waLink }
      }
      const errText = await res.text().catch(() => `HTTP ${res.status}`)
      return { sent: false, provider: 'evolution', sent_at: sentAt, wa_link: waLink, error: errText }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Erro WhatsApp'
      return { sent: false, provider: 'evolution', sent_at: sentAt, wa_link: waLink, error: errMsg }
    }
  }

  return {
    sent: false,
    provider: 'wa_link',
    sent_at: sentAt,
    wa_link: waLink,
    error: 'WHATSAPP_API_URL não configurado — use o link wa.me',
  }
}
