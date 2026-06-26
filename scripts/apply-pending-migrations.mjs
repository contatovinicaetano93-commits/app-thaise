#!/usr/bin/env node
/**
 * Aplica migrations pendentes no Supabase remoto.
 *
 * Requer UMA das opções no .env.local:
 *   DATABASE_URL=postgresql://...          (Settings → Database → Connection string)
 *   SUPABASE_ACCESS_TOKEN=sbp_...        (Account → Access Tokens)
 *
 * Uso: npm run setup:apply-pending
 */
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

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

function resolveAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN
  const cliToken = join(homedir(), '.supabase', 'access-token')
  if (existsSync(cliToken)) return readFileSync(cliToken, 'utf8').trim()
  return null
}

function resolveProjectRef() {
  const linked = resolve(root, 'supabase/.temp/project-ref')
  if (existsSync(linked)) return readFileSync(linked, 'utf8').trim()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  return url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dbUrl = process.env.DATABASE_URL
const accessToken = resolveAccessToken()
const projectRef = resolveProjectRef()

const MIGRATIONS = [
  { name: 'storage_checklist', file: 'supabase/migration_storage_checklist.sql', table: null },
  { name: 'pipeline', file: 'supabase/migration_pipeline.sql', table: 'opportunities' },
  { name: 'estlar_eos', file: 'supabase/migration_estlar_eos.sql', table: 'weekly_reports' },
  { name: 'rls_tighten', file: 'supabase/migration_rls_tighten.sql', table: null, always: true },
]

async function tableExists(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  return res.ok
}

async function runSql(sql, label) {
  if (dbUrl) {
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    await client.connect()
    try {
      await client.query(sql)
      console.log(`✅ ${label} (via DATABASE_URL)`)
    } finally {
      await client.end()
    }
    return
  }

  if (!accessToken || !projectRef) {
    throw new Error('Credencial ausente')
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${label}: HTTP ${res.status} — ${body}`)
  }
  console.log(`✅ ${label} (via Management API)`)
}

if (!dbUrl && !accessToken) {
  console.log(`
⚠️  Não foi possível conectar ao Postgres remoto.

Adicione UMA destas variáveis no .env.local e rode novamente:

  DATABASE_URL=postgresql://postgres.[ref]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
  (Supabase → Settings → Database → Connection string → URI)

  — ou —

  SUPABASE_ACCESS_TOKEN=sbp_...
  (https://supabase.com/dashboard/account/tokens)

Depois: npm run setup:apply-pending
`)
  process.exit(1)
}

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local')
  process.exit(1)
}

console.log('\n📦 Aplicando migrations pendentes...\n')

let applied = 0
for (const m of MIGRATIONS) {
  if (!m.always && m.table && (await tableExists(m.table))) {
    console.log(`⏭️  ${m.name} — já aplicada (${m.table} existe)`)
    continue
  }

  const path = resolve(root, m.file)
  if (!existsSync(path)) {
    console.log(`⚠️  ${m.file} não encontrado — pulando`)
    continue
  }

  const sql = readFileSync(path, 'utf8')
  try {
    await runSql(sql, m.name)
    applied++
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('already exists') || msg.includes('duplicate')) {
      console.log(`⚠️  ${m.name} — parcialmente aplicada (objetos já existem)`)
    } else {
      console.error(`❌ ${m.name}:`, msg)
      process.exit(1)
    }
  }
}

console.log(applied ? `\n✅ ${applied} migration(s) aplicada(s)\n` : '\n✅ Nenhuma migration pendente\n')
