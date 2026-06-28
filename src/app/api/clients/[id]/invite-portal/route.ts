import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { inviteAppUser } from '@/lib/auth/invite-user'
import { generateTempPassword } from '@/lib/auth/invite-email'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(8).optional(),
  full_name: z.string().min(2).optional(),
})

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id } = await params
    const body = schema.parse(await _req.json().catch(() => ({})))
    const db = await createSupabaseServer()

    const { data: client } = await db
      .from('clients')
      .select('id, name, email')
      .eq('id', id)
      .single() as { data: { id: string; name: string; email: string } | null }

    if (!client) return err('Cliente não encontrado', 404)

    const password = body.password ?? generateTempPassword()
    const fullName = body.full_name ?? client.name

    const user = await inviteAppUser({
      email: client.email,
      password,
      fullName,
      role: 'cliente',
      clientId: client.id,
      sendEmail: true,
    })

    return ok({
      user,
      email: user.inviteEmail,
      temporaryPassword: password,
    }, undefined, 201)
  } catch (e) {
    if (e instanceof Error) return err(e.message, 422)
    return handleError(e)
  }
}
