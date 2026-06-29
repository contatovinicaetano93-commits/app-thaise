import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isSimpleMode } from '@/lib/app-mode'
import { quoteCreateUrl, skuRequestCreateUrl } from '@/lib/flow-links'

type Step = { label: string; href: string; reason: string; sipoc: string }

/** Próximo passo — fluxo v2 Estlar Hub (modo simples) ou legado */
export async function GET() {
  try {
    const { profile, error: authErr } = await requireProfile()
    if (authErr) return authErr

    const role = profile!.role
    const isGestor = role === 'gestor'
    const isFornecedor = role === 'fornecedor'
    const isCliente = role === 'cliente'
    const v2 = isSimpleMode()

    const db = await createSupabaseServer()
    const steps: Step[] = []

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

    if (isGestor && v2) {
      const [
        { count: pendingSuppliers },
        { count: activeSuppliers },
        { count: clientCount },
        { count: projectCount },
        { count: skuSubmitted },
        { count: quotesSent },
        { count: quotesApproved },
        { count: draftQuotes },
        { count: openSku },
        { count: openOrders },
        { data: portalOff },
        { data: projectNoSku },
      ] = await Promise.all([
        db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        db.from('clients').select('id', { count: 'exact', head: true }),
        db.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing']),
        db.from('projects').select('id, name').eq('status', 'active').eq('portal_enabled', false).limit(1),
        db.from('projects').select('id, name').eq('status', 'active').limit(5),
      ])

      if ((pendingSuppliers ?? 0) > 0) {
        steps.push({
          sipoc: '1',
          label: 'Homologar fornecedores',
          href: '/pending-suppliers',
          reason: `${pendingSuppliers} fornecedor(es) aguardando curadoria`,
        })
      }
      if ((activeSuppliers ?? 0) === 0) {
        steps.push({
          sipoc: '2',
          label: 'Cadastrar fornecedor',
          href: '/suppliers',
          reason: 'Nenhum fornecedor ativo — homologue antes de pedir SKUs',
        })
      }
      if ((clientCount ?? 0) === 0) {
        steps.push({
          sipoc: '3',
          label: 'Cadastrar cliente',
          href: '/clients',
          reason: 'Toda obra precisa de um cliente vinculado',
        })
      }
      if ((projectCount ?? 0) === 0) {
        steps.push({
          sipoc: '4',
          label: 'Criar obra',
          href: '/projects?new=1',
          reason: 'Inicie o empreendimento e defina as fases',
        })
      }
      if ((skuSubmitted ?? 0) > 0) {
        steps.push({
          sipoc: '5',
          label: 'Aprovar SKUs no catálogo',
          href: '/sku-requests?status=submitted',
          reason: `${skuSubmitted} produto(s) enviados pelo fornecedor aguardam sua aprovação`,
        })
      }
      if ((quotesApproved ?? 0) > 0) {
        steps.push({
          sipoc: '8',
          label: 'Gerar pedidos do orçamento',
          href: '/quotes',
          reason: `${quotesApproved} orçamento(s) aprovados pelo cliente — gere os pedidos`,
        })
      }
      if ((quotesSent ?? 0) > 0) {
        steps.push({
          sipoc: '7',
          label: 'Aguardando cliente aprovar orçamento',
          href: '/quotes',
          reason: `${quotesSent} orçamento(s) enviados — cliente decide em Meus orçamentos`,
        })
      }
      if (portalOff?.length) {
        const p = portalOff[0] as { id: string; name: string }
        steps.push({
          sipoc: '6',
          label: 'Liberar portal do cliente',
          href: `/projects?open=${p.id}`,
          reason: `Obra "${p.name}" — libere o portal antes de enviar orçamento`,
        })
      }
      if ((draftQuotes ?? 0) > 0) {
        steps.push({
          sipoc: '6',
          label: 'Enviar orçamento ao cliente',
          href: '/quotes',
          reason: `${draftQuotes} rascunho(s) prontos para envio`,
        })
      }
      if ((openSku ?? 0) > 0) {
        steps.push({
          sipoc: '5',
          label: 'Aguardar fornecedor cadastrar SKU',
          href: '/sku-requests?status=open',
          reason: `${openSku} pedido(s) de SKU aguardando resposta do fornecedor`,
        })
      }

      // Obra sem SKU pedido e sem orçamento
      for (const p of projectNoSku ?? []) {
        const proj = p as { id: string; name: string }
        const [{ count: skus }, { count: quotes }, { count: products }] = await Promise.all([
          db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('project_id', proj.id),
          db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('project_id', proj.id),
          db.from('products').select('id', { count: 'exact', head: true }).eq('project_id', proj.id).eq('catalog_status', 'approved'),
        ])
        if ((quotes ?? 0) === 0 && (products ?? 0) === 0 && (skus ?? 0) === 0) {
          steps.push({
            sipoc: '5',
            label: `Pedir SKU — ${proj.name}`,
            href: skuRequestCreateUrl({ projectId: proj.id }),
            reason: 'Obra sem produtos aprovados — solicite SKU ao fornecedor',
          })
          break
        }
        if ((quotes ?? 0) === 0 && (products ?? 0) > 0) {
          steps.push({
            sipoc: '6',
            label: `Montar orçamento — ${proj.name}`,
            href: quoteCreateUrl(proj.id),
            reason: 'Produtos aprovados — monte o orçamento para o cliente',
          })
          break
        }
      }

      if ((openOrders ?? 0) > 0) {
        steps.push({
          sipoc: '9',
          label: 'Acompanhar pedidos',
          href: '/orders',
          reason: `${openOrders} pedido(s) em andamento — fornecedor foi notificado para separar`,
        })
      }

      steps.push({
        sipoc: '→',
        label: 'Convidar usuários',
        href: '/users',
        reason: 'Crie logins de cliente e fornecedor para os portais',
      })

      return ok({ next: steps[0] ?? null, steps })
    }

    // ── Fornecedor v2 ──
    if (isFornecedor && v2) {
      const supplierId = profile!.supplier_id!
      const [{ count: openSkus }, { count: openOrders }] = await Promise.all([
        db.from('sku_requests').select('id', { count: 'exact', head: true }).eq('supplier_id', supplierId).eq('status', 'open'),
        db.from('orders').select('id', { count: 'exact', head: true }).eq('supplier_id', supplierId).in('status', ['pending', 'approved', 'processing']),
      ])

      if ((openSkus ?? 0) > 0) {
        steps.push({
          sipoc: '5',
          label: 'Cadastrar produto do SKU pedido',
          href: '/sku-requests?status=open',
          reason: `${openSkus} pedido(s) de SKU da Estlar aguardam seu cadastro`,
        })
      }
      if ((openOrders ?? 0) > 0) {
        steps.push({
          sipoc: '9',
          label: 'Separar produtos dos pedidos',
          href: '/orders',
          reason: `${openOrders} pedido(s) para produção`,
        })
      }
      return ok({ next: steps[0] ?? null, steps })
    }

    // ── Cliente v2 ──
    if (isCliente && v2) {
      const clientId = profile!.client_id!
      const [{ count: pendingQuotes }, { count: sentReports }, { count: projects }] = await Promise.all([
        db.from('project_quotes').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'sent'),
        db.from('weekly_reports').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        db.from('projects').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('portal_enabled', true),
      ])

      if ((pendingQuotes ?? 0) > 0) {
        steps.push({
          sipoc: '7',
          label: 'Aprovar orçamento',
          href: '/quotes',
          reason: `${pendingQuotes} orçamento(s) aguardando sua decisão`,
        })
      }
      if ((projects ?? 0) > 0) {
        steps.push({
          sipoc: 'C',
          label: 'Acompanhar minha obra',
          href: '/projects',
          reason: 'Veja o progresso % e as fases da obra',
        })
      }
      if ((sentReports ?? 0) > 0) {
        steps.push({
          sipoc: 'C',
          label: 'Relatório 360',
          href: '/reports/weekly',
          reason: `${sentReports} atualização(ões) semanal(is) disponível(is)`,
        })
      }
      return ok({ next: steps[0] ?? null, steps })
    }

    // ── Modo legado (NEXT_PUBLIC_SIMPLE_MODE=0) ──
    const [
      { count: pendingSuppliers },
      { count: activeSuppliers },
      { count: clientCount },
      { count: projects },
      { count: openOrders },
    ] = await Promise.all([
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('projects').select('id', { count: 'exact', head: true }),
      db.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved', 'processing']),
    ])

    if (isGestor) {
      if ((pendingSuppliers ?? 0) > 0) {
        steps.push({ sipoc: 'S', label: 'Homologar fornecedores', href: '/pending-suppliers', reason: `${pendingSuppliers} pendente(s)` })
      }
      if ((projects ?? 0) === 0) {
        steps.push({ sipoc: 'I', label: 'Criar empreendimento', href: '/projects', reason: 'Inicie a jornada A→F' })
      }
      if ((openOrders ?? 0) > 0) {
        steps.push({ sipoc: 'P', label: 'Acompanhar pedidos', href: '/orders', reason: `${openOrders} em aberto` })
      } else if ((clientCount ?? 0) > 0 && (activeSuppliers ?? 0) > 0) {
        steps.push({ sipoc: 'O', label: 'Criar pedido', href: '/orders', reason: 'Conecte cliente, produto e fornecedor' })
      }
    }

    if (isFornecedor && (openOrders ?? 0) > 0) {
      steps.push({ sipoc: 'P', label: 'Pedidos para produção', href: '/orders', reason: `${openOrders} em aberto` })
    }

    if (isCliente) {
      steps.push({ sipoc: 'C', label: 'Ver empreendimentos', href: '/projects', reason: 'Acompanhe sua obra' })
    }

    return ok({ next: steps[0] ?? null, steps })
  } catch (e) {
    return handleError(e)
  }
}
