#!/usr/bin/env node
/**
 * Valida variáveis de ambiente obrigatórias.
 * Uso: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) {
    console.error('❌ .env.local não encontrado. Copie: cp .env.example .env.local')
    process.exit(1)
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnv()

const required = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'Project Settings → API → Project URL'],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'Project Settings → API → Publishable key'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Project Settings → API → Secret / service_role key'],
]

const optional = [
  ['DATABASE_URL', 'Settings → Database → Connection string (para apply-schema automático)'],
  ['SEED_GESTOR_EMAIL', 'Email do usuário gestor (seed)'],
  ['SEED_GESTOR_PASSWORD', 'Senha do usuário gestor (seed)'],
]

let ok = true

console.log('\n📋 Checklist de ambiente — Plataforma Thaise\n')

for (const [key, hint] of required) {
  const val = process.env[key]
  if (!val) {
    console.log(`❌ ${key} — faltando (${hint})`)
    ok = false
  } else {
    console.log(`✅ ${key}`)
  }
}

console.log('\nOpcionais:')
for (const [key, hint] of optional) {
  const val = process.env[key]
  console.log(val ? `✅ ${key}` : `⚪ ${key} — ${hint}`)
}

if (!ok) {
  console.log('\nCorrija o .env.local e rode novamente.\n')
  process.exit(1)
}

console.log('\n✅ Variáveis obrigatórias OK\n')
