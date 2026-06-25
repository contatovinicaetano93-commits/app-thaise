#!/usr/bin/env node
/**
 * Popula clientes, produtos, empreendimento e pedidos de demonstração.
 * Idempotente — pula registros que já existem (por email/nome).
 *
 * Uso: npm run seed:data
 * Pré-requisito: npm run seed && npm run seed:demo (gestor + fornecedor demo)
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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
  Prefer: 'return=representation',
}

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = { message: text } }
  return { ok: res.ok, status: res.status, json }
}

async function findOne(table, filter) {
  const r = await api(`/rest/v1/${table}?${filter}&select=*&limit=1`)
  const row = Array.isArray(r.json) ? r.json[0] : r.json
  return row?.id ? row : null
}

async function ensureClient({ name, email, phone, company, segment }) {
  const existing = await findOne('clients', `email=eq.${encodeURIComponent(email)}`)
  if (existing) {
    console.log(`  ↳ cliente já existe: ${email}`)
    return existing
  }
  const r = await api('/rest/v1/clients', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, company, segment }),
  })
  const row = r.json?.[0] ?? r.json
  if (!row?.id) throw new Error(`Falha ao criar cliente ${email}: ${JSON.stringify(r.json)}`)
  console.log(`  ✅ cliente: ${name}`)
  return row
}

async function ensureProduct(supplierId, { name, category, price, unit, lead_time_days }) {
  const existing = await findOne(
    'products',
    `supplier_id=eq.${supplierId}&name=eq.${encodeURIComponent(name)}`,
  )
  if (existing) {
    console.log(`  ↳ produto já existe: ${name}`)
    return existing
  }
  const r = await api('/rest/v1/products', {
    method: 'POST',
    body: JSON.stringify({
      supplier_id: supplierId,
      name,
      category,
      price,
      unit,
      lead_time_days,
      active: true,
    }),
  })
  const row = r.json?.[0] ?? r.json
  if (!row?.id) throw new Error(`Falha ao criar produto ${name}: ${JSON.stringify(r.json)}`)
  console.log(`  ✅ produto: ${name}`)
  return row
}

async function ensureProject({ name, client_id, location }) {
  const existing = await findOne('projects', `name=eq.${encodeURIComponent(name)}`)
  if (existing) {
    console.log(`  ↳ empreendimento já existe: ${name}`)
    return existing
  }
  const r = await api('/rest/v1/projects', {
    method: 'POST',
    body: JSON.stringify({
      name,
      client_id,
      location,
      phase: 'A',
      status: 'active',
    }),
  })
  const row = r.json?.[0] ?? r.json
  if (!row?.id) throw new Error(`Falha ao criar projeto ${name}: ${JSON.stringify(r.json)}`)
  console.log(`  ✅ empreendimento: ${name}`)
  return row
}

async function ensureOrder({ project_id, client_id, supplier_id, product_id, quantity, unit_price, status }) {
  const r = await api('/rest/v1/orders', {
    method: 'POST',
    body: JSON.stringify({
      project_id,
      client_id,
      supplier_id,
      product_id,
      quantity,
      unit_price,
      status,
    }),
  })
  const row = r.json?.[0] ?? r.json
  if (!row?.id) {
    console.log(`  ⚠️  pedido não criado (pode já existir fluxo similar):`, r.json?.message ?? r.json)
    return null
  }
  console.log(`  ✅ pedido: ${row.id.slice(0, 8)}… (${status})`)
  return row
}

async function logActivity(entity_type, entity_id, event_type, title, detail) {
  await api('/rest/v1/activity_events', {
    method: 'POST',
    body: JSON.stringify({
      entity_type,
      entity_id,
      event_type,
      title,
      detail,
      metadata: { source: 'seed-demo-data' },
    }),
  })
}

console.log('\n🌱 Seed dados demo — clientes, catálogo, pedidos\n')

const supplier =
  (await findOne('suppliers', 'name=eq.Fornecedor%20Demo')) ??
  (await findOne('suppliers', 'status=eq.active&order=created_at.asc&limit=1'))

if (!supplier?.id) {
  console.error('❌ Nenhum fornecedor ativo. Rode: npm run seed:demo')
  process.exit(1)
}
console.log(`Fornecedor base: ${supplier.name} (${supplier.id.slice(0, 8)}…)\n`)

console.log('Clientes:')
const c1 = await ensureClient({
  name: 'Maria Oliveira',
  email: 'maria.oliveira@demo.com',
  phone: '(11) 98765-4321',
  company: 'Oliveira Incorporações',
  segment: 'Incorporadora',
})
const c2 = await ensureClient({
  name: 'Carlos Mendes',
  email: 'carlos.mendes@demo.com',
  phone: '(21) 99876-5432',
  company: 'Mendes Construções',
  segment: 'Construtora',
})
const c3 = await ensureClient({
  name: 'Ana Costa',
  email: 'ana.costa@demo.com',
  phone: '(31) 97654-3210',
  company: 'Studio Costa Arquitetura',
  segment: 'Arquiteto/Designer',
})

console.log('\nProdutos:')
const p1 = await ensureProduct(supplier.id, {
  name: 'Porcelanato 90x90 Premium',
  category: 'Revestimentos',
  price: 89.9,
  unit: 'm²',
  lead_time_days: 14,
})
const p2 = await ensureProduct(supplier.id, {
  name: 'Esquadria Alumínio Linha Gold',
  category: 'Esquadrias',
  price: 450,
  unit: 'm²',
  lead_time_days: 21,
})
const p3 = await ensureProduct(supplier.id, {
  name: 'Bancada Quartzo Branco',
  category: 'Marmoraria',
  price: 1200,
  unit: 'm',
  lead_time_days: 10,
})

console.log('\nEmpreendimento:')
const project = await ensureProject({
  name: 'Residencial Jardim das Acácias',
  client_id: c1.id,
  location: 'Campinas, SP',
})

console.log('\nPedidos:')
await ensureOrder({
  project_id: project.id,
  client_id: c1.id,
  supplier_id: supplier.id,
  product_id: p1.id,
  quantity: 120,
  unit_price: 89.9,
  status: 'processing',
})
await ensureOrder({
  project_id: project.id,
  client_id: c1.id,
  supplier_id: supplier.id,
  product_id: p2.id,
  quantity: 45,
  unit_price: 450,
  status: 'approved',
})
await ensureOrder({
  project_id: null,
  client_id: c2.id,
  supplier_id: supplier.id,
  product_id: p3.id,
  quantity: 8,
  unit_price: 1200,
  status: 'delivered',
})

console.log('\nMemória (activity_events):')
for (const [entity_type, entity_id, title] of [
  ['client', c1.id, 'Cliente demo — Maria Oliveira'],
  ['product', p1.id, 'Produto demo — Porcelanato'],
  ['project', project.id, 'Empreendimento demo — Jardim das Acácias'],
]) {
  await logActivity(entity_type, entity_id, `${entity_type}.seed`, 'Dado de demonstração', title)
}
console.log('  ✅ eventos registrados')

console.log('\n✅ Seed de dados concluído!')
console.log('→ npm run dev → http://localhost:3000/dashboard\n')
console.log('💡 Para Realtime instantâneo, rode no Supabase SQL Editor:')
console.log('   supabase/migration_realtime.sql\n')
