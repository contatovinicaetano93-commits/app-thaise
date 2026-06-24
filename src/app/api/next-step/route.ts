import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = createServerClient()
    const steps: Array<{ label: string; href: string; reason: string }> = []

    const { count: pendingSuppliers } = await db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    if ((pendingSuppliers ?? 0) > 0 && profile?.role === 'gestor') {
      steps.push({ label: 'Homologar fornecedores', href: '/pending-suppliers', reason: `${pendingSuppliers} pendente(s)` })
    }

    const { count: projects } = await db.from('projects').select('id', { count: 'exact', head: true })
    if ((projects ?? 0) === 0) {
      steps.push({ label: 'Criar empreendimento', href: '/projects', reason: 'Inicie a jornada A→F' })
    }

    const { count: productCount } = await db.from('products').select('id', { count: 'exact', head: true })
    if ((productCount ?? 0) === 0 && profile?.role === 'gestor') {
      steps.push({ label: 'Montar catálogo', href: '/products', reason: 'Cadastre produtos dos fornecedores' })
    }

    const { count: clientCount } = await db.from('clients').select('id', { count: 'exact', head: true })
    if ((clientCount ?? 0) === 0 && profile?.role === 'gestor') {
      steps.push({ label: 'Cadastrar clientes', href: '/clients', reason: 'Base para pedidos e empreendimentos' })
    }

    const { count: openOrders } = await db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing'])
    if ((openOrders ?? 0) > 0) {
      steps.push({ label: 'Acompanhar pedidos', href: '/orders', reason: `${openOrders} em aberto` })
    } else {
      steps.push({ label: 'Criar pedido', href: '/orders', reason: 'Conecte cliente, produto e fornecedor' })
    }

    return ok({ next: steps[0] ?? null, steps })
  } catch (e) {
    return handleError(e)
  }
}
