#!/usr/bin/env node
/**
 * Aplica um arquivo SQL de migration via DATABASE_URL.
 * Uso: node scripts/apply-migration.mjs supabase/migration_realtime.sql
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

const file = process.argv[2]
if (!file) {
  console.error('Uso: node scripts/apply-migration.mjs <caminho.sql>')
  process.exit(1)
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.log('⚠️  DATABASE_URL não configurada — aplique manualmente no SQL Editor:')
  console.log(`   ${resolve(root, file)}\n`)
  process.exit(0)
}

const sql = readFileSync(resolve(root, file), 'utf8')
const client = new pg.Client({ connectionString: dbUrl })
await client.connect()
try {
  await client.query(sql)
  console.log(`✅ Migration aplicada: ${file}`)
} finally {
  await client.end()
}
