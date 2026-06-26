import { z } from 'zod'
import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { inviteAppUser } from '@/lib/auth/invite-user'

const inviteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  full_name: z.string().min(2),
  role: z.enum(['fornecedor', 'cliente']),
  supplier_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.role === 'fornecedor' && !data.supplier_id) {
    ctx.addIssue({ code: 'custom', message: 'Fornecedor obrigatório', path: ['supplier_id'] })
  }
  if (data.role === 'cliente' && !data.client_id) {
    ctx.addIssue({ code: 'custom', message: 'Cliente obrigatório', path: ['client_id'] })
  }
})

export async function POST(req: Request) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const body = inviteSchema.parse(await req.json())
    const user = await inviteAppUser({
      email: body.email,
      password: body.password,
      fullName: body.full_name,
      role: body.role,
      supplierId: body.supplier_id,
      clientId: body.client_id,
    })

    return ok(user, { invited_by: profile!.id }, 201)
  } catch (e) {
    if (e instanceof Error && !('issues' in (e as object))) {
      return err(e.message, 422)
    }
    return handleError(e)
  }
}
