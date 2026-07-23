import { ok, err, handleError } from '@/lib/api-response'
import { requireGestor } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logActivity } from '@/lib/memory/events'
import { notifySupplierHomologated } from '@/lib/notify/supplier-homologated'

export async function GET() {
  try {
    const { error: authErr } = await requireGestor()
    if (authErr) return authErr

    const db = await createSupabaseServer()
    const { data, error } = await db
      .from('suppliers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return err(error.message, 500)
    return ok(data ?? [])
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: Request) {
  try {
    const { profile, error: authErr } = await requireGestor()
    if (authErr) return authErr

    const { id, action } = await req.json() as { id: string; action: 'approve' | 'reject' }
    if (!id || !action) return err('id e action são obrigatórios', 422)

    const db = await createSupabaseServer()
    const newStatus = action === 'approve' ? 'active' : 'inactive'

    const { data, error } = await db
      .from('suppliers')
      .update({ status: newStatus } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) return err(error.message, 500)

    const supplier = data as {
      id: string
      name: string
      contact_email: string
      contact_name: string
    }

    await logActivity({
      entityType: 'supplier',
      entityId: id,
      eventType: action === 'approve' ? 'supplier.approved' : 'supplier.rejected',
      title: action === 'approve' ? 'Fornecedor homologado' : 'Fornecedor rejeitado',
      actorId: profile?.id,
    })

    let email: Awaited<ReturnType<typeof notifySupplierHomologated>> | undefined
    if (action === 'approve' && supplier.contact_email) {
      email = await notifySupplierHomologated({
        contactEmail: supplier.contact_email,
        contactName: supplier.contact_name,
        supplierName: supplier.name,
      })
    }

    return ok({ ...supplier, email })
  } catch (e) {
    return handleError(e)
  }
}
