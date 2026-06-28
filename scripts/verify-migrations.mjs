#!/usr/bin/env node
/** Verifica se tabelas das migrations existem no Supabase. */
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

const tables = [
  ['schema base', 'suppliers', 'id'],
  ['resilience_memory', 'activity_events', 'id'],
  ['resilience_memory', 'order_status_log', 'id'],
  ['resilience_memory', 'processed_jobs', 'id'],
  ['scale_webhooks', 'webhooks', 'id'],
  ['scale_webhooks', 'notifications', 'id'],
  ['pipeline', 'opportunities', 'id'],
  ['estlar_eos', 'weekly_reports', 'id'],
  ['estlar_eos', 'welcome_kits', 'id'],
  ['estlar_eos', 'project_diary_entries', 'id'],
  ['estlar_eos', 'scope_amendments', 'id'],
  ['estlar_eos', 'quotations', 'id'],
  ['estlar_eos', 'operational_config', 'key'],
  ['rls_tighten', 'job_logs', 'id'],
  ['rls_tighten', 'agent_insights', 'id'],
  ['a_first', 'webhook_deliveries', 'id'],
]

const columnChecks = [
  ['gtm_lgpd', 'opportunities', 'intake_consent_at'],
]

console.log('\n📦 Verificando migrations no Supabase...\n')

let ok = true
for (const [migration, table, column] of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok || res.status === 200) {
    console.log(`✅ ${table} (${migration})`)
  } else {
    console.log(`❌ ${table} (${migration}) — HTTP ${res.status}`)
    ok = false
  }
}

for (const [migration, table, column] of columnChecks) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=0`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok || res.status === 200) {
    console.log(`✅ ${table}.${column} (${migration})`)
  } else {
    console.log(`❌ ${table}.${column} (${migration}) — HTTP ${res.status}`)
    ok = false
  }
}

console.log(ok ? '\n✅ Migrations OK\n' : '\n⚠️  Rode as migrations faltantes no SQL Editor\n')
process.exit(ok ? 0 : 1)
