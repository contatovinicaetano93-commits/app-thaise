#!/usr/bin/env node
/**
 * Remove dados de demonstração (dry-run por padrão).
 * Preserva contas de smoke (@plataforma.com) e entidades vinculadas aos profiles.
 *
 * Uso:
 *   npm run cleanup:demo          # lista o que seria removido
 *   CONFIRM_CLEANUP=1 npm run cleanup:demo -- --apply
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const apply = process.argv.includes('--apply')
const confirmed = process.env.CONFIRM_CLEANUP === '1'

function loadEnv() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) throw new Error('.env.local não encontrado')
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim()
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatórios')
  process.exit(1)
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = { message: text } }
  return { ok: res.ok, status: res.status, json }
}

async function fetchAll(table, query = 'select=id') {
  const res = await api(`/rest/v1/${table}?${query}`)
  if (!res.ok) return []
  return Array.isArray(res.json) ? res.json : []
}

const SMOKE_EMAILS = new Set([
  'thaise@plataforma.com',
  'fornecedor@plataforma.com',
  'cliente@plataforma.com',
])

const DEMO_PATTERNS = ['@demo.com', '.pipeline.demo']

function isDemoEmail(email) {
  if (!email) return false
  if (SMOKE_EMAILS.has(email)) return false
  return DEMO_PATTERNS.some(p => email.includes(p))
}

async function getPreservedEntityIds() {
  const profiles = await fetchAll('profiles', 'select=id,email,supplier_id,client_id')
  const preserved = { supplierIds: new Set(), clientIds: new Set() }
  for (const p of profiles) {
    if (!SMOKE_EMAILS.has(p.email)) continue
    if (p.supplier_id) preserved.supplierIds.add(p.supplier_id)
    if (p.client_id) preserved.clientIds.add(p.client_id)
  }
  return preserved
}

function inSet(id, set) {
  return id && set.has(id)
}

async function deleteByIds(table, ids) {
  if (!ids.length) return 0
  const chunkSize = 40
  let deleted = 0
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const q = chunk.map(id => `id.eq.${id}`).join(',')
    const res = await api(`/rest/v1/${table}?or=(${q})`, { method: 'DELETE' })
    if (res.ok) deleted += chunk.length
  }
  return deleted
}

async function deleteWhereIn(table, field, ids) {
  if (!ids.length) return 0
  const chunkSize = 40
  let deleted = 0
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const q = chunk.map(id => `${field}.eq.${id}`).join(',')
    const res = await api(`/rest/v1/${table}?or=(${q})`, { method: 'DELETE' })
    if (res.ok) deleted += chunk.length
  }
  return deleted
}

console.log(`\n🧹 Cleanup demo — ${apply ? 'APLICAR' : 'DRY-RUN'}\n`)

const preserved = await getPreservedEntityIds()
console.log(`Preservando entidades smoke: ${preserved.supplierIds.size} fornecedor(es), ${preserved.clientIds.size} cliente(s)\n`)

const allClients = await fetchAll('clients', 'select=id,email,name')
const demoClients = allClients.filter(c => isDemoEmail(c.email) && !inSet(c.id, preserved.clientIds))

const allSuppliers = await fetchAll('suppliers', 'select=id,contact_email,name')
const demoSuppliers = allSuppliers.filter(
  s => isDemoEmail(s.contact_email) && !inSet(s.id, preserved.supplierIds),
)

const allOpportunities = await fetchAll('opportunities', 'select=id,email,name')
const demoOpportunities = allOpportunities.filter(o => isDemoEmail(o.email))

const demoClientIds = new Set(demoClients.map(c => c.id))
const demoSupplierIds = new Set(demoSuppliers.map(s => s.id))

const allProjects = await fetchAll('projects', 'select=id,name,client_id')
const demoProjects = allProjects.filter(
  p => (p.client_id && demoClientIds.has(p.client_id)) || /^Residencial Jardim das Acácias$/i.test(p.name ?? ''),
)

const allProducts = await fetchAll('products', 'select=id,name,supplier_id')
const demoProducts = allProducts.filter(p => p.supplier_id && demoSupplierIds.has(p.supplier_id))

const allOrders = await fetchAll('orders', 'select=id,client_id,supplier_id,project_id')
const demoOrders = allOrders.filter(
  o =>
    (o.client_id && demoClientIds.has(o.client_id)) ||
    (o.supplier_id && demoSupplierIds.has(o.supplier_id)) ||
    (o.project_id && demoProjects.some(p => p.id === o.project_id)),
)

console.log(`Oportunidades demo: ${demoOpportunities.length}`)
console.log(`Clientes demo: ${demoClients.length}`)
demoClients.slice(0, 8).forEach(c => console.log(`  · ${c.name} <${c.email}>`))
if (demoClients.length > 8) console.log(`  … +${demoClients.length - 8}`)

console.log(`Fornecedores demo: ${demoSuppliers.length}`)
demoSuppliers.forEach(s => console.log(`  · ${s.name} <${s.contact_email}>`))

console.log(`Empreendimentos demo: ${demoProjects.length}`)
console.log(`Produtos demo: ${demoProducts.length}`)
console.log(`Pedidos demo: ${demoOrders.length}`)

if (apply) {
  if (!confirmed) {
    console.error('\n❌ Defina CONFIRM_CLEANUP=1 para aplicar\n')
    process.exit(1)
  }

  const demoProjectIds = demoProjects.map(p => p.id)
  const demoOrderIds = demoOrders.map(o => o.id)

  if (demoOrderIds.length) {
    await deleteWhereIn('order_status_log', 'order_id', demoOrderIds)
    await deleteByIds('orders', demoOrderIds)
  }

  if (demoProjectIds.length) {
    await deleteWhereIn('weekly_reports', 'project_id', demoProjectIds)
    await deleteWhereIn('project_diary_entries', 'project_id', demoProjectIds)
    await deleteWhereIn('scope_amendments', 'project_id', demoProjectIds)
    await deleteWhereIn('quotations', 'project_id', demoProjectIds)
    await deleteWhereIn('welcome_kits', 'project_id', demoProjectIds)
    await deleteByIds('projects', demoProjectIds)
  }

  await deleteByIds('products', demoProducts.map(p => p.id))
  await deleteByIds('opportunities', demoOpportunities.map(o => o.id))
  await deleteByIds('clients', demoClients.map(c => c.id))
  await deleteByIds('suppliers', demoSuppliers.map(s => s.id))

  console.log('\n✅ Registros demo removidos')
  console.log('ℹ️  Usuários Auth (@plataforma.com) e entidades vinculadas foram preservados\n')
} else {
  console.log('\nℹ️  Rode: CONFIRM_CLEANUP=1 npm run cleanup:demo -- --apply\n')
}
