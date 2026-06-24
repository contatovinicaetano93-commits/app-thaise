#!/usr/bin/env node
/**
 * Aplica schema.sql via conexão Postgres direta.
 * Requer DATABASE_URL no .env.local
 * Uso: node scripts/apply-schema.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
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

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.log(`
⚠️  DATABASE_URL não configurada — apply automático não disponível.

Faça manualmente:
  1. Abra https://supabase.com/dashboard/project/jaokeypptatywvarwlao/sql/new
  2. Cole o conteúdo de supabase/schema.sql
  3. Clique Run

Para automatizar depois, adicione no .env.local:
  DATABASE_URL=postgresql://postgres.[ref]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
`)
  process.exit(0)
}

const sql = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8')

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

try {
  console.log('🔌 Conectando ao Postgres...')
  await client.connect()
  console.log('📦 Aplicando schema.sql...')
  await client.query(sql)
  console.log('✅ Schema aplicado com sucesso!\n')
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes('already exists')) {
    console.log('⚠️  Algumas tabelas já existem — schema parcialmente aplicado.')
    console.log('   Se o app já funcionava, está OK.\n')
  } else {
    console.error('❌ Erro ao aplicar schema:', msg)
    console.log('\nAlternativa: rode supabase/schema.sql no SQL Editor do dashboard.\n')
    process.exit(1)
  }
} finally {
  await client.end()
}
