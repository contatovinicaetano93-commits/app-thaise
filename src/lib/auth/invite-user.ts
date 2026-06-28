import { createServiceClient } from '@/lib/supabase-server'
import { getSupabaseUrl } from '@/lib/supabase/env'
import { sendPortalInviteEmail } from '@/lib/auth/invite-email'
import type { EmailResult } from '@/lib/notify/email'
import type { UserRole } from '@/lib/auth/roles'

export interface InviteUserInput {
  email: string
  password: string
  fullName: string
  role: Extract<UserRole, 'fornecedor' | 'cliente'>
  supplierId?: string | null
  clientId?: string | null
  sendEmail?: boolean
}

export interface InvitedUser {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  supplier_id: string | null
  client_id: string | null
  created_at: string
  inviteEmail?: EmailResult & { magicLink?: string | null }
}

export async function inviteAppUser(input: InviteUserInput): Promise<InvitedUser> {
  const db = createServiceClient()

  if (input.role === 'fornecedor' && !input.supplierId) {
    throw new Error('Selecione o fornecedor vinculado')
  }
  if (input.role === 'cliente' && !input.clientId) {
    throw new Error('Selecione o cliente vinculado')
  }

  if (input.role === 'fornecedor') {
    const { data: supplier } = await db.from('suppliers').select('id').eq('id', input.supplierId!).single()
    if (!supplier) throw new Error('Fornecedor não encontrado')
  }

  if (input.role === 'cliente') {
    const { data: client } = await db.from('clients').select('id').eq('id', input.clientId!).single()
    if (!client) throw new Error('Cliente não encontrado')
  }

  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role: input.role,
      full_name: input.fullName,
    },
  })

  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'Erro ao criar usuário'
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      throw new Error('Este e-mail já possui login na plataforma')
    }
    throw new Error(msg)
  }

  const userId = created.user.id

  const url = getSupabaseUrl()?.replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !serviceKey) throw new Error('Supabase não configurado')

  const patchRes = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      role: input.role,
      full_name: input.fullName,
      supplier_id: input.role === 'fornecedor' ? input.supplierId : null,
      client_id: input.role === 'cliente' ? input.clientId : null,
      onboarding_completed_at: new Date().toISOString(),
    }),
  })

  const patchJson = await patchRes.json().catch(() => null)
  const profile = Array.isArray(patchJson) ? patchJson[0] : patchJson

  if (!patchRes.ok || !profile?.id) {
    await db.auth.admin.deleteUser(userId).catch(() => {})
    throw new Error('Erro ao vincular perfil do usuário')
  }

  let inviteEmail: (EmailResult & { magicLink?: string | null }) | undefined
  if (input.sendEmail !== false) {
    inviteEmail = await sendPortalInviteEmail({
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      password: input.password,
    })
  }

  return { ...(profile as InvitedUser), inviteEmail }
}

export async function listAppUsers(): Promise<InvitedUser[]> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, role, supplier_id, client_id, created_at')
    .order('created_at', { ascending: false }) as { data: InvitedUser[] | null; error: { message: string } | null }

  if (error) throw new Error(error.message)
  return data ?? []
}
