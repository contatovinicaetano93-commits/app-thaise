import { sendEmail, type EmailResult } from '@/lib/notify/email'

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/** Aviso de homologação para o contato do fornecedor (não cria login — use Convidar ao portal). */
export async function notifySupplierHomologated(input: {
  contactEmail: string
  contactName: string
  supplierName: string
}): Promise<EmailResult> {
  const loginUrl = `${getAppUrl()}/login`
  return sendEmail({
    to: input.contactEmail,
    subject: `Estlar — ${input.supplierName} homologado`,
    body: [
      `Olá ${input.contactName},`,
      '',
      `A Estlar homologou o fornecedor "${input.supplierName}" no Hub de Arquitetura.`,
      '',
      'Você já faz parte do catálogo curado. Em breve a gestora pode convidar você ao portal',
      'para cadastrar SKUs e acompanhar pedidos.',
      '',
      `Portal: ${loginUrl}`,
      '',
      '— Equipe Estlar',
    ].join('\n'),
  })
}
