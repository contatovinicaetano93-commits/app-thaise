#!/usr/bin/env node
/**
 * Remove dados de demonstração (dry-run por padrão).
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
}

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

const DEMO_EMAILS = [
  'fornecedor@plataforma.com',
  'cliente@plataforma.com',
  'fornecedor@demo.com',
  'cliente@demo.com',
]

const DEMO_PATTERNS = ['@demo.com', '.pipeline.demo']

function isDemoEmail(email) {
  if (!email) return false
  if (DEMO_EMAILS.includes(email)) return true
  return DEMO_PATTERNS.some(p => email.includes(p))
}

async function listDemo(table, emailField = 'email') {
  const res = await api(`/rest/v1/${table}?select=id,${emailField}`)
  if (!res.ok) return []
  return (res.json ?? []).filter(r => isDemoEmail(r[emailField]))
}

async function deleteByIds(table, ids) {
  if (!ids.length) return
  const q = ids.map(id => `id.eq.${id}`).join(',')
  await api(`/rest/v1/${table}?or=(${q})`, { method: 'DELETE' })
}

console.log(`\n🧹 Cleanup demo — ${apply ? 'APLICAR' : 'DRY-RUN'}\n`)

const clients = await listDemo('clients')
const opportunities = await listDemo('opportunities')
const suppliers = (await api('/rest/v1/suppliers?select=id,contact_email')).json?.filter(
  (s: { contact_email: string }) => isDemoEmail(s.contact_email),
) ?? []

console.log(`Clientes demo: ${clients.length}`)
console.log(`Oportunidades demo: ${opportunities.length}`)
console.log(`Fornecedores demo: ${suppliers.length}`)

if (apply) {
  if (!confirmed) {
    console.error('\n❌ Defina CONFIRM_CLEANUP=1 para aplicar\n')
    process.exit(1)
  }
  await deleteByIds('opportunities', opportunities.map((o: { id: string }) => o.id))
  await deleteByIds('clients', clients.map((c: { id: string }) => c.id))
  await deleteByIds('suppliers', suppliers.map((s: { id: string }) => s.id))
  console.log('\n✅ Registros demo removidos (usuários Auth não foram apagados)\n')
} else {
  console.log('\nℹ️  Rode com CONFIRM_CLEANUP=1 npm run cleanup:demo -- --apply para remover\n')
}
