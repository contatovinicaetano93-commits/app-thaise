import { createServiceClient } from '@/lib/supabase-server'
import { sendEmail, type EmailResult } from '@/lib/notify/email'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles'

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

async function tryMagicLink(email: string): Promise<string | null> {
  try {
    const db = createServiceClient()
    const { data, error } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${getAppUrl()}/dashboard` },
    })
    if (error) return null
    return data?.properties?.action_link ?? null
  } catch {
    return null
  }
}

export async function sendPortalInviteEmail(input: {
  email: string
  fullName: string
  role: Extract<UserRole, 'cliente' | 'fornecedor'>
  password: string
}): Promise<EmailResult & { magicLink?: string | null }> {
  const loginUrl = `${getAppUrl()}/login`
  const portalName = input.role === 'cliente' ? 'Refúgio Digital' : 'Portal Fornecedor'
  const magicLink = await tryMagicLink(input.email)

  const lines = [
    `Olá ${input.fullName},`,
    '',
    `Seu acesso ao Hub Estlar (${portalName}) foi criado.`,
    '',
    `Login: ${loginUrl}`,
    `E-mail: ${input.email}`,
    `Senha inicial: ${input.password}`,
    '',
    'Recomendamos trocar a senha no primeiro acesso (Recuperar acesso na tela de login).',
  ]

  if (magicLink) {
    lines.push('', 'Ou entre direto com este link (válido por tempo limitado):', magicLink)
  }

  lines.push('', '— Equipe Estlar')

  const result = await sendEmail({
    to: input.email,
    subject: `Acesso ao Hub Estlar — ${ROLE_LABELS[input.role]}`,
    body: lines.join('\n'),
  })

  return { ...result, magicLink }
}
