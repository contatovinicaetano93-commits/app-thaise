#!/usr/bin/env node
/**
 * Cria usuário gestor no Supabase Auth.
 * Uso: npm run seed
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.SEED_GESTOR_EMAIL ?? 'thaise@plataforma.com'
const password = process.env.SEED_GESTOR_PASSWORD ?? 'Thaise2026!'

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  process.exit(1)
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { message: text } }
  return { ok: res.ok, status: res.status, json }
}

console.log('\n👤 Setup gestor — Plataforma Thaise\n')

// 1. Verifica se schema existe
const tables = await api('/rest/v1/suppliers?select=id&limit=1')
if (!tables.ok) {
  const msg = tables.json?.message ?? tables.json?.hint ?? JSON.stringify(tables.json)
  if (msg.includes('does not exist') || tables.status === 404) {
    console.error('❌ Tabelas não encontradas. Rode o schema primeiro:\n')
    console.error('   https://supabase.com/dashboard/project/jaokeypptatywvarwlao/sql/new')
    console.error('   Cole: supabase/schema.sql → Run\n')
    process.exit(1)
  }
  console.error('❌ Erro ao conectar:', msg)
  process.exit(1)
}
console.log('✅ Banco conectado (tabela suppliers OK)')

// 2. Lista usuários existentes
const users = await api('/auth/v1/admin/users?page=1&per_page=50')
if (!users.ok) {
  console.error('❌ Erro Auth API:', users.json?.message ?? users.json?.msg ?? JSON.stringify(users.json))
  console.error('   Verifique SUPABASE_SERVICE_ROLE_KEY no .env.local\n')
  process.exit(1)
}

const existing = users.json?.users?.find(u => u.email === email)
if (existing) {
  console.log(`✅ Usuário já existe: ${email}`)
  console.log(`   ID: ${existing.id}\n`)
  console.log('→ http://localhost:3000/login\n')
  process.exit(0)
}

// 3. Cria gestor
const created = await api('/auth/v1/admin/users', {
  method: 'POST',
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'gestor', full_name: 'Thaise Resende' },
  }),
})

if (!created.ok) {
  console.error('❌ Erro ao criar usuário:', created.json?.message ?? created.json?.msg ?? JSON.stringify(created.json))
  process.exit(1)
}

console.log('✅ Gestor criado!\n')
console.log(`   Email:  ${email}`)
console.log(`   Senha:  ${password}`)
console.log(`   ID:     ${created.json?.id ?? created.json?.user?.id}`)
console.log('\n⚠️  Troque a senha após o primeiro login.')
console.log('→ http://localhost:3000/login\n')
