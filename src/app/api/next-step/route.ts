import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'

/** Próximo passo — SIPOC + pipeline comercial, adaptado por role */
export async function GET() {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const role = profile!.role
    const isGestor = role === 'gestor'
    const isFornecedor = role === 'fornecedor'
    const isCliente = role === 'cliente'

    const db = await createSupabaseServer()
    const steps: Array<{ label: string; href: string; reason: string; sipoc: string }> = []

    // Perfil incompleto
    if (isFornecedor && !profile!.supplier_id) {
      return ok({
        next: { label: 'Conta incompleta', href: '/dashboard', reason: 'Peça ao gestor para vincular seu fornecedor', sipoc: '!' },
        steps: [],
      })
    }
    if (isCliente && !profile!.client_id) {
      return ok({
        next: { label: 'Conta incompleta', href: '/dashboard', reason: 'Peça ao gestor para vincular seu cadastro de cliente', sipoc: '!' },
        steps: [],
      })
    }

    const [
      { count: pendingSuppliers },
      { count: activeSuppliers },
      { count: clientCount },
      { count: productCount },
      { count: projects },
      { count: openOrders },
      { count: intakeReview },
      { count: pipelineActive },
    ] = await Promise.all([
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('products').select('id', { count: 'exact', head: true }),
      db.from('projects').select('id', { count: 'exact', head: true }),
      db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing']),
      isGestor
        ? db.from('opportunities').select('id', { count: 'exact', head: true }).in('intake_status', ['pending', 'review'])
        : Promise.resolve({ count: 0 }),
      isGestor
        ? db.from('opportunities').select('id', { count: 'exact', head: true }).not('stage', 'in', '(ganho,perdido)')
        : Promise.resolve({ count: 0 }),
    ])

    if (isGestor) {
      if ((intakeReview ?? 0) > 0) {
        steps.push({
          sipoc: 'I',
          label: 'Revisar leads do intake',
          href: '/pipeline?filter=intake',
          reason: `${intakeReview} lead(s) aguardando revisão`,
        })
      }
      if ((pipelineActive ?? 0) > 0 && (projects ?? 0) === 0) {
        steps.push({
          sipoc: 'I',
          label: 'Avançar pipeline comercial',
          href: '/pipeline',
          reason: `${pipelineActive} oportunidade(s) no funil — converta em empreendimento`,
        })
      }
      if ((pendingSuppliers ?? 0) > 0) {
        steps.push({
          sipoc: 'S',
          label: 'Homologar fornecedores',
          href: '/pending-suppliers',
          reason: `${pendingSuppliers} pendente(s) — curadoria SIPOC`,
        })
      }
      if ((activeSuppliers ?? 0) === 0) {
        steps.push({
          sipoc: 'S',
          label: 'Cadastrar fornecedor',
          href: '/suppliers',
          reason: 'Nenhum fornecedor ativo no processo',
        })
      }
      if ((clientCount ?? 0) === 0 && (pipelineActive ?? 0) === 0) {
        steps.push({
          sipoc: 'I',
          label: 'Cadastrar clientes',
          href: '/clients',
          reason: 'Base para pedidos e empreendimentos',
        })
      }
      if ((productCount ?? 0) === 0) {
        steps.push({
          sipoc: 'I',
          label: 'Montar catálogo',
          href: '/products',
          reason: 'Produtos são entradas do processo',
        })
      }
      if ((projects ?? 0) === 0 && (pipelineActive ?? 0) === 0) {
        steps.push({
          sipoc: 'I',
          label: 'Criar empreendimento',
          href: '/projects',
          reason: 'Inicie a jornada A→F (ou converta do pipeline)',
        })
      }
      steps.push({
        sipoc: 'O',
        label: 'Convidar usuários',
        href: '/users',
        reason: 'Crie logins de cliente e fornecedor para os portais',
      })
    }

    if ((openOrders ?? 0) > 0) {
      steps.push({
        sipoc: 'P',
        label: isFornecedor ? 'Pedidos para produção' : isCliente ? 'Acompanhar meus pedidos' : 'Acompanhar pedidos',
        href: '/orders',
        reason: `${openOrders} em aberto`,
      })
    } else if (isGestor && (clientCount ?? 0) > 0 && (productCount ?? 0) > 0 && (activeSuppliers ?? 0) > 0) {
      steps.push({
        sipoc: 'O',
        label: 'Criar pedido',
        href: '/orders',
        reason: 'Conecte cliente, produto e fornecedor',
      })
    } else if (isFornecedor && (productCount ?? 0) === 0) {
      steps.push({
        sipoc: 'P',
        label: 'Cadastrar produtos',
        href: '/products',
        reason: 'Monte seu catálogo para receber pedidos',
      })
    } else if (isCliente && (projects ?? 0) > 0) {
      steps.push({
        sipoc: 'C',
        label: 'Ver empreendimentos',
        href: '/projects',
        reason: 'Acompanhe a fase A→F do seu projeto',
      })
    }

    if (isGestor && (openOrders ?? 0) === 0 && (projects ?? 0) > 0) {
      steps.push({
        sipoc: 'C',
        label: 'Ver insights AI',
        href: '/insights',
        reason: 'Análises QCPS para decisões',
      })
    }

    return ok({ next: steps[0] ?? null, steps })
  } catch (e) {
    return handleError(e)
  }
}
