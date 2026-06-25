import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createServerClient } from '@/lib/supabase-server'

/** Próximo passo ordenado pelo fluxo SIPOC: S → I → P → O → C */
export async function GET() {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = createServerClient()
    const steps: Array<{ label: string; href: string; reason: string; sipoc: string }> = []

    const [
      { count: pendingSuppliers },
      { count: activeSuppliers },
      { count: clientCount },
      { count: productCount },
      { count: projects },
      { count: openOrders },
    ] = await Promise.all([
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('products').select('id', { count: 'exact', head: true }),
      db.from('projects').select('id', { count: 'exact', head: true }),
      db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing']),
    ])

    const isGestor = profile?.role === 'gestor'

    // S — Fornecedores
    if ((pendingSuppliers ?? 0) > 0 && isGestor) {
      steps.push({
        sipoc: 'S',
        label: 'Homologar fornecedores',
        href: '/pending-suppliers',
        reason: `${pendingSuppliers} pendente(s) — curadoria SIPOC`,
      })
    }
    if ((activeSuppliers ?? 0) === 0 && isGestor) {
      steps.push({
        sipoc: 'S',
        label: 'Cadastrar fornecedor',
        href: '/suppliers',
        reason: 'Nenhum fornecedor ativo no processo',
      })
    }

    // I — Entradas (clientes, catálogo, empreendimentos)
    if ((clientCount ?? 0) === 0 && isGestor) {
      steps.push({
        sipoc: 'I',
        label: 'Cadastrar clientes',
        href: '/clients',
        reason: 'Base para pedidos e empreendimentos',
      })
    }
    if ((productCount ?? 0) === 0 && isGestor) {
      steps.push({
        sipoc: 'I',
        label: 'Montar catálogo',
        href: '/products',
        reason: 'Produtos são entradas do processo',
      })
    }
    if ((projects ?? 0) === 0 && isGestor) {
      steps.push({
        sipoc: 'I',
        label: 'Criar empreendimento',
        href: '/projects',
        reason: 'Inicie a jornada A→F',
      })
    }

    // P / O — Processo e saídas (pedidos)
    if ((openOrders ?? 0) > 0) {
      steps.push({
        sipoc: 'P',
        label: 'Acompanhar pedidos',
        href: '/orders',
        reason: `${openOrders} em aberto`,
      })
    } else if ((clientCount ?? 0) > 0 && (productCount ?? 0) > 0 && (activeSuppliers ?? 0) > 0) {
      steps.push({
        sipoc: 'O',
        label: 'Criar pedido',
        href: '/orders',
        reason: 'Conecte cliente, produto e fornecedor',
      })
    }

    // C — Cliente final (insights)
    if ((openOrders ?? 0) === 0 && (projects ?? 0) > 0) {
      steps.push({
        sipoc: 'C',
        label: 'Ver insights AI',
        href: '/insights',
        reason: 'Análises QCPS para o cliente',
      })
    }

    return ok({ next: steps[0] ?? null, steps })
  } catch (e) {
    return handleError(e)
  }
}
