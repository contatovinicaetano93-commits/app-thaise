import { ok, handleError } from '@/lib/api-response'
import { requireProfile } from '@/lib/auth/api-context'
import { createSupabaseServer } from '@/lib/supabase/server'
import { qcpsAverage } from '@/lib/qcps'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function GET() {
  try {
    const { error: authErr } = await requireProfile()
    if (authErr) return authErr

    const db = await createSupabaseServer()

    const [suppliersRes, clientsRes, ordersRes, projectsRes, productsRes] = await Promise.all([
      db.from('suppliers').select('id, name, status, score_q, score_c, score_p, score_s, score'),
      db.from('clients').select('id', { count: 'exact', head: true }),
      db.from('orders').select('id, status, total_price, created_at, supplier_id, client:clients(name), supplier:suppliers(name)'),
      db.from('projects').select('id', { count: 'exact', head: true }),
      db.from('products').select('id, supplier_id, created_at, active'),
    ])

    if (suppliersRes.error) return ok(emptyDashboard(suppliersRes.error.message))
    if (ordersRes.error) return ok(emptyDashboard(ordersRes.error.message))

    const suppliers = (suppliersRes.data ?? []) as Array<{
      id: string
      name: string
      status: string
      score_q: number
      score_c: number
      score_p: number
      score_s: number
      score: number | null
    }>
    const orders = (ordersRes.data ?? []) as Array<{
      id: string
      status: string
      total_price: number
      created_at: string
      supplier_id: string
      client?: { name: string }
      supplier?: { name: string }
    }>

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const monthlyMap = new Map<string, { pedidos: number; receita: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyMap.set(key, { pedidos: 0, receita: 0 })
    }

    let monthRevenue = 0
    let monthOrders = 0
    const openOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))

    for (const o of orders) {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (monthlyMap.has(key)) {
        const m = monthlyMap.get(key)!
        m.pedidos += 1
        m.receita += Number(o.total_price) || 0
      }
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        monthOrders += 1
        monthRevenue += Number(o.total_price) || 0
      }
    }

    const monthly = [...monthlyMap.entries()].map(([key, v]) => {
      const [, m] = key.split('-').map(Number)
      return { mes: MONTHS[m], pedidos: v.pedidos, receita: v.receita }
    })

    const orderCountBySupplier = new Map<string, number>()
    for (const o of orders) {
      orderCountBySupplier.set(o.supplier_id, (orderCountBySupplier.get(o.supplier_id) ?? 0) + 1)
    }

    const topSuppliers = suppliers
      .map(s => ({
        id: s.id,
        nome: s.name,
        score: s.score ?? qcpsAverage(s as { score_q: number; score_c: number; score_p: number; score_s: number }),
        pedidos: orderCountBySupplier.get(s.id) ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const recentOrders = orders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        client: o.client?.name ?? '—',
        supplier: o.supplier?.name ?? '—',
        value: Number(o.total_price) || 0,
        status: o.status,
        date: o.created_at,
      }))

    const activeSuppliers = suppliers.filter(s => s.status === 'active').length
    const pendingSuppliers = suppliers.filter(s => s.status === 'pending').length

    const products = (productsRes.data ?? []) as Array<{
      id: string
      supplier_id: string
      created_at: string
      active: boolean
    }>
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoMs = weekAgo.getTime()

    const newThisWeek = products.filter(p => new Date(p.created_at).getTime() >= weekAgoMs)
    const suppliersThisWeek = new Set(newThisWeek.map(p => p.supplier_id)).size
    const activeSupplierIds = new Set(suppliers.filter(s => s.status === 'active').map(s => s.id))
    const catalogProducts = products.filter(p => p.active && activeSupplierIds.has(p.supplier_id))

    return ok({
      counts: {
        suppliers: suppliers.length,
        activeSuppliers,
        pendingSuppliers,
        clients: clientsRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        orders: orders.length,
        openOrders: openOrders.length,
        monthRevenue,
        monthOrders,
      },
      catalogIntake: {
        newThisWeek: newThisWeek.length,
        suppliersThisWeek,
        totalInCatalog: catalogProducts.length,
        totalSuppliersInCatalog: new Set(catalogProducts.map(p => p.supplier_id)).size,
      },
      monthly,
      recentOrders,
      topSuppliers,
    })
  } catch (e) {
    return handleError(e)
  }
}

function emptyDashboard(error?: string) {
  return {
    counts: {
      suppliers: 0, activeSuppliers: 0, pendingSuppliers: 0,
      clients: 0, projects: 0, orders: 0, openOrders: 0,
      monthRevenue: 0, monthOrders: 0,
    },
    catalogIntake: {
      newThisWeek: 0,
      suppliersThisWeek: 0,
      totalInCatalog: 0,
      totalSuppliersInCatalog: 0,
    },
    monthly: MONTHS.slice(0, 6).map(m => ({ mes: m, pedidos: 0, receita: 0 })),
    recentOrders: [],
    topSuppliers: [],
    error,
  }
}
