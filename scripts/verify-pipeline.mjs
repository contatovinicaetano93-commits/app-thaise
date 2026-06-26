#!/usr/bin/env node
/**
 * Valida migration_pipeline + dados demo + API produção.
 * Uso: node scripts/verify-pipeline.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (!existsSync(envPath)) {
  console.error('❌ .env.local não encontrado')
  process.exit(1)
}

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const prodBase = process.env.SMOKE_BASE_URL ?? 'https://app-thaise.vercel.app'
const gestorEmail = process.env.SEED_GESTOR_EMAIL ?? 'thaise@plataforma.com'
const gestorPassword = process.env.SEED_GESTOR_PASSWORD ?? 'Thaise2026!'

const REQUIRED_COLUMNS = [
  'id', 'name', 'company', 'email', 'phone', 'source', 'budget_estimate',
  'stage', 'notes', 'lost_reason', 'client_id', 'project_id',
  'created_at', 'updated_at', 'closed_at',
]

const STAGES = [
  'primeiro_contato', 'briefing', 'viabilidade_previa', 'proposta', 'contrato',
]

let failed = 0
function ok(msg) { console.log(`  ✅ ${msg}`) }
function bad(msg) { console.log(`  ❌ ${msg}`); failed++ }
function info(msg) { console.log(`  ℹ️  ${msg}`) }

function svcHeaders(extra = {}) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...extra }
}

console.log('\n🔍 Validação Pipeline Comercial Thaise\n')
console.log(`Supabase: ${supabaseUrl}`)
console.log(`Produção: ${prodBase}\n`)

// ── 1. Tabela opportunities ──
console.log('── Banco (Supabase) ──')
const tableRes = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=*&limit=1`, {
  headers: svcHeaders(),
})
if (!tableRes.ok) {
  bad(`Tabela opportunities — HTTP ${tableRes.status}`)
  console.log('     → Rode supabase/migration_pipeline.sql no SQL Editor\n')
} else {
  ok('Tabela opportunities acessível')
  const sample = (await tableRes.json())[0]
  if (sample) {
    for (const col of REQUIRED_COLUMNS) {
      if (col in sample) ok(`Coluna ${col}`)
      else bad(`Coluna ausente: ${col}`)
    }
  } else {
    info('Tabela vazia — rode npm run seed:pipeline')
  }
}

// ── 2. activity_events opportunity ──
const oppList = await fetch(`${supabaseUrl}/rest/v1/opportunities?select=id&limit=1`, {
  headers: svcHeaders(),
})
const [firstOpp] = oppList.ok ? await oppList.json() : []
if (firstOpp?.id) {
  const actRes = await fetch(`${supabaseUrl}/rest/v1/activity_events`, {
    method: 'POST',
    headers: svcHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify({
      entity_type: 'opportunity',
      entity_id: firstOpp.id,
      event_type: 'pipeline.verify',
      title: 'Verificação automática',
      detail: 'verify-pipeline.mjs',
    }),
  })
  if (actRes.ok) {
    ok('activity_events aceita entity_type=opportunity')
    const [ev] = await actRes.json()
    await fetch(`${supabaseUrl}/rest/v1/activity_events?id=eq.${ev.id}`, {
      method: 'DELETE',
      headers: svcHeaders(),
    })
  } else {
    bad(`activity_events opportunity — HTTP ${actRes.status} (rode constraint na migration)`)
  }
}

// ── 3. Dados demo por etapa ──
let dbOpportunityCount = 0
const allRes = await fetch(
  `${supabaseUrl}/rest/v1/opportunities?select=stage,name&stage=in.(${STAGES.join(',')})`,
  { headers: svcHeaders() },
)
if (allRes.ok) {
  const rows = await allRes.json()
  dbOpportunityCount = rows.length
  const byStage = Object.fromEntries(STAGES.map(s => [s, rows.filter(r => r.stage === s)]))
  ok(`${rows.length} oportunidade(s) ativa(s) no funil`)
  for (const stage of STAGES) {
    const n = byStage[stage].length
    if (n > 0) ok(`Etapa ${stage}: ${n} card(s)`)
    else info(`Etapa ${stage}: vazia (opcional para demo)`)
  }
}

// ── 4. RLS gestor via API produção ──
console.log('\n── API Produção ──')
const healthRes = await fetch(`${prodBase}/api/health`)
try {
  const health = await healthRes.json()
  if (healthRes.ok && health.data?.db === 'ok') ok(`Health ${healthRes.status} · db ok`)
  else bad(`Health — ${JSON.stringify(health).slice(0, 100)}`)
} catch (e) {
  bad(`Health unreachable: ${e.message}`)
}

let gestorCookie = ''
if (anonKey) {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: gestorEmail, password: gestorPassword }),
  })
  const authJson = await authRes.json()
  if (authRes.ok && authJson.access_token) {
    ok(`Login gestor (${gestorEmail})`)
    const session = authJson
    gestorCookie = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${encodeURIComponent(JSON.stringify(session))}`
  } else {
    bad(`Login gestor falhou: ${authJson.error_description ?? authJson.msg ?? authRes.status}`)
  }
} else {
  bad('Chave anon/publishable não configurada')
}

if (gestorCookie) {
  const oppApi = await fetch(`${prodBase}/api/opportunities`, {
    headers: { Cookie: gestorCookie },
  })
  const oppText = await oppApi.text()
  let oppJson
  try { oppJson = JSON.parse(oppText) } catch { oppJson = null }
  if (oppApi.ok && oppJson?.ok) {
    const count = Array.isArray(oppJson.data) ? oppJson.data.length : 0
    if (count === 0 && dbOpportunityCount > 0) {
      bad(`GET /api/opportunities → 0 (banco tem ${dbOpportunityCount}) — sessão/RLS ou cache; atualize o deploy`)
    } else {
      ok(`GET /api/opportunities → ${count} oportunidade(s)`)
    }
  } else if (oppApi.status === 404) {
    bad('GET /api/opportunities — 404 (código do pipeline ainda não deployado na Vercel)')
  } else {
    bad(`GET /api/opportunities — HTTP ${oppApi.status}: ${oppJson?.error ?? oppText.slice(0, 80)}`)
  }

  const pageRes = await fetch(`${prodBase}/pipeline`, { redirect: 'manual' })
  if (pageRes.status === 200) {
    ok(`Página /pipeline — HTTP 200`)
  } else if (pageRes.status === 307 || pageRes.status === 308) {
    ok(`Página /pipeline — redirect ${pageRes.status} (auth)`)
  } else if (pageRes.status === 404) {
    bad('Página /pipeline — 404 (faça deploy do código do pipeline: commit + push)')
  } else {
    bad(`Página /pipeline — HTTP ${pageRes.status}`)
  }
}

// ── 5. DATABASE_URL ──
console.log('\n── Ambiente local ──')
if (process.env.DATABASE_URL) ok('DATABASE_URL configurada (migrations automáticas)')
else info('DATABASE_URL ausente — migrations via SQL Editor manual')

console.log(failed === 0 ? '\n✅ Validação completa — pipeline OK\n' : `\n⚠️  ${failed} problema(s) encontrado(s)\n`)
process.exit(failed === 0 ? 0 : 1)
