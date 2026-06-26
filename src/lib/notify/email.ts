export interface EmailMessage {
  to: string
  subject: string
  body: string
}

export interface EmailResult {
  sent: boolean
  provider: 'stub' | 'resend'
  sent_at: string
}

/**
 * Envio de e-mail transacional.
 * Configure RESEND_API_KEY na Vercel para envio real (https://resend.com).
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const sentAt = new Date().toISOString()
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Plataforma Thaise <noreply@plataforma.com>'

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
      console.error('[email] Resend error', await res.text())
    } catch (e) {
      console.error('[email] Resend failed', e)
    }
  }

  console.info('[email-stub]', { ...message, sent_at: sentAt })
  return { sent: false, provider: 'stub', sent_at: sentAt }
}
