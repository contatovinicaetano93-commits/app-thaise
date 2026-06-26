#!/usr/bin/env node
/**
 * Smoke test produção: health, auth por role e APIs principais.
 * Uso: npm run smoke:prod
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim()
  }
}

loadEnv()

const BASE = process.env.SMOKE_BASE_URL ?? 'https://app-thaise.vercel.app'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const USERS = [
  { label: 'gestor', email: process.env.SEED_GESTOR_EMAIL ?? 'thaise@plataforma.com', password: process.env.SEED_GESTOR_PASSWORD ?? 'Thaise2026!' },
  { label: 'fornecedor', email: 'fornecedor@plataforma.com', password: 'Demo2026!' },
  { label: 'cliente', email: 'cliente@plataforma.com', password: 'Demo2026!' },
]

const results = []

function pass(msg) { results.push({ ok: true, msg }); console.log(`  ✅ ${msg}`) }
function fail(msg) { results.push({ ok: false, msg }); console.log(`  ❌ ${msg}`) }

async function testHealth() {
  console.log('\n── Health ──')
  try {
    const res = await fetch(`${BASE}/api/health`)
    const json = await res.json()
    if (res.ok && json.data?.db === 'ok') pass(`Health ${res.status} · db ok`)
    else fail(`Health ${res.status} · ${JSON.stringify(json).slice(0, 120)}`)
  } catch (e) {
    fail(`Health unreachable: ${e.message}`)
  }
}

async function testRole(user) {
  console.log(`\n── Auth ${user.label} ──`)
  if (!url || !key) {
    fail('Supabase não configurado no .env.local')
    return
  }

  const authRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  })
  const authJson = await authRes.json()
  if (!authRes.ok) {
    fail(`${user.label} login: ${authJson.error_description ?? authJson.msg ?? authRes.status}`)
    return
  }
  pass(`${user.label} login ok (${user.email})`)

  const token = authJson.access_token
  const userId = authJson.user?.id

  const profileRes = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=role,supplier_id,client_id`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  })
  const profiles = await profileRes.json()
  const profile = profiles?.[0]
  if (!profile) fail(`${user.label} sem profile`)
  else pass(`${user.label} role=${profile.role}`)

  const clientsRes = await fetch(`${url}/rest/v1/clients?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${token}`, Prefer: 'count=exact' },
  })
  const clients = await clientsRes.json()
  if (clientsRes.status === 401 || clients?.message) fail(`${user.label} clients RLS: ${clients.message ?? clientsRes.status}`)
  else pass(`${user.label} clients visíveis: ${Array.isArray(clients) ? clients.length : 0}`)

  const ordersRes = await fetch(`${url}/rest/v1/orders?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  })
  const orders = await ordersRes.json()
  pass(`${user.label} orders visíveis: ${Array.isArray(orders) ? orders.length : 0}`)
}

async function testPublicPages() {
  console.log('\n── Páginas públicas ──')
  for (const path of ['/login', '/intake']) {
    const res = await fetch(`${BASE}${path}`, { redirect: 'manual' })
    if (res.status === 200 || res.status === 307 || res.status === 308) pass(`${path} acessível (${res.status})`)
    else fail(`${path} HTTP ${res.status}`)
  }
}

async function testGestorApi(token) {
  console.log('\n── API gestor (cookie-less — esperado 401) ──')
  const res = await fetch(`${BASE}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) pass('API /users exige sessão cookie (401 com bearer)')
  else if (res.ok) pass('API /users ok')
  else fail(`API /users HTTP ${res.status}`)
}

async function main() {
  console.log(`Smoke test · ${BASE}`)
  await testHealth()
  await testPublicPages()
  let gestorToken = null
  for (const u of USERS) {
    await testRole(u)
    if (u.label === 'gestor' && url && key) {
      const authRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.password }),
      })
      const authJson = await authRes.json()
      gestorToken = authJson.access_token
    }
  }
  if (gestorToken) await testGestorApi(gestorToken)

  const failed = results.filter(r => !r.ok).length
  console.log(`\n${failed === 0 ? '✅ Todos os testes passaram' : `❌ ${failed} falha(s)`}`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
