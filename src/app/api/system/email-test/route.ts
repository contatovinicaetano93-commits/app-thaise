import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { sendEmail } from '@/lib/notify/email'
import { isLlmConfigured } from '@/lib/llm'

export async function GET() {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    return ok({
      resend_configured: Boolean(process.env.RESEND_API_KEY),
      email_from: process.env.EMAIL_FROM ?? '(padrão: Estlar <noreply@estlar.com.br>)',
      app_url: process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000',
      llm_configured: isLlmConfigured(),
      gestor_email: profile!.email,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST() {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const to = profile!.email
    if (!to) return err('Perfil sem e-mail', 422)

    const result = await sendEmail({
      to,
      subject: 'Teste Hub Estlar — e-mail transacional',
      body: [
        'Olá,',
        '',
        'Este é um e-mail de teste do Hub Estlar.',
        'Se você recebeu, o Resend está configurado corretamente na Vercel.',
        '',
        `Enviado em: ${new Date().toISOString()}`,
        '— Hub Estlar',
      ].join('\n'),
    })

    if (result.sent) {
      return ok({ ...result, to, message: `E-mail de teste enviado para ${to}` })
    }

    return ok({
      ...result,
      to,
      message: result.error ?? 'E-mail não enviado — verifique RESEND_API_KEY e EMAIL_FROM',
    })
  } catch (e) {
    return handleError(e)
  }
}
