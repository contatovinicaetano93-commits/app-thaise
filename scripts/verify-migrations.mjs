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
  ['schema base', 'suppliers'],
  ['resilience_memory', 'activity_events'],
  ['resilience_memory', 'order_status_log'],
  ['resilience_memory', 'processed_jobs'],
  ['scale_webhooks', 'webhooks'],
  ['scale_webhooks', 'notifications'],
  ['pipeline', 'opportunities'],
  ['estlar_eos', 'weekly_reports'],
  ['estlar_eos', 'welcome_kits'],
  ['estlar_eos', 'project_diary_entries'],
  ['estlar_eos', 'scope_amendments'],
  ['estlar_eos', 'quotations'],
  ['estlar_eos', 'operational_config'],
]

console.log('\n📦 Verificando migrations no Supabase...\n')

let ok = true
for (const [migration, table] of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (res.ok || res.status === 200) {
    console.log(`✅ ${table} (${migration})`)
  } else {
    console.log(`❌ ${table} (${migration}) — HTTP ${res.status}`)
    ok = false
  }
}

console.log(ok ? '\n✅ Migrations OK\n' : '\n⚠️  Rode as migrations faltantes no SQL Editor\n')
process.exit(ok ? 0 : 1)
