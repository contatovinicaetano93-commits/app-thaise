export interface EmailMessage {
  to: string
  subject: string
  body: string
}

export interface EmailResult {
  sent: boolean
  provider: 'stub' | 'resend'
  sent_at: string
  error?: string
}

/**
 * Envio de e-mail transacional.
 * Configure RESEND_API_KEY na Vercel para envio real (https://resend.com).
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const sentAt = new Date().toISOString()
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Estlar <noreply@estlar.com.br>'

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.body,
        }),
      })
      if (res.ok) return { sent: true, provider: 'resend', sent_at: sentAt }
      const errText = await res.text()
      console.error('[email] Resend error', errText)
      let errMsg = errText.slice(0, 200)
      try {
        const parsed = JSON.parse(errText) as { message?: string }
        if (parsed.message) errMsg = parsed.message
      } catch { /* raw text */ }
      return { sent: false, provider: 'resend', sent_at: sentAt, error: errMsg }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Erro de rede'
      console.error('[email] Resend failed', e)
      return { sent: false, provider: 'resend', sent_at: sentAt, error: errMsg }
    }
  }

  console.info('[email-stub]', { ...message, sent_at: sentAt })
  return { sent: false, provider: 'stub', sent_at: sentAt, error: 'RESEND_API_KEY não configurada' }
}
