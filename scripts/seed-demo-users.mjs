#!/usr/bin/env node
/** Cria fornecedor + cliente de demo com usuários Auth vinculados */
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
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, json }
}

console.log('\n🌱 Seed demo — fornecedor + cliente\n')

const supplier = await api('/rest/v1/suppliers', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Fornecedor Demo',
    category: 'Materiais',
    contact_name: 'João Demo',
    contact_email: 'fornecedor@demo.com',
    contact_phone: '11999990001',
    status: 'active',
  }),
})

const supplierId = supplier.json?.[0]?.id ?? supplier.json?.id
if (!supplierId) {
  console.log('Fornecedor demo já existe ou erro:', JSON.stringify(supplier.json))
} else {
  console.log('✅ Fornecedor:', supplierId)
}

const client = await api('/rest/v1/clients', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    phone: '11999990002',
    company: 'Demo Ltda',
    segment: 'Residencial',
  }),
})

const clientId = client.json?.[0]?.id ?? client.json?.id
if (!clientId) {
  console.log('Cliente demo já existe ou erro:', JSON.stringify(client.json))
} else {
  console.log('✅ Cliente:', clientId)
}

for (const [email, role, meta] of [
  ['fornecedor@plataforma.com', 'fornecedor', { role: 'fornecedor', full_name: 'Fornecedor Demo', supplier_id: supplierId }],
  ['cliente@plataforma.com', 'cliente', { role: 'cliente', full_name: 'Cliente Demo', client_id: clientId }],
]) {
  const users = await api('/auth/v1/admin/users?page=1&per_page=50')
  const existing = users.json?.users?.find(u => u.email === email)
  if (existing) {
    console.log(`✅ Usuário ${role} já existe:`, email)
    continue
  }
  const created = await api('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Demo2026!', email_confirm: true, user_metadata: meta }),
  })
  if (created.ok) {
    const uid = created.json?.id
    if (uid && supplierId && role === 'fornecedor') {
      await api(`/rest/v1/profiles?id=eq.${uid}`, { method: 'PATCH', body: JSON.stringify({ supplier_id: supplierId }) })
    }
    if (uid && clientId && role === 'cliente') {
      await api(`/rest/v1/profiles?id=eq.${uid}`, { method: 'PATCH', body: JSON.stringify({ client_id: clientId }) })
    }
    console.log(`✅ ${role}:`, email, '/ Demo2026!')
  } else {
    console.log(`⚠️  ${role}:`, created.json?.message ?? JSON.stringify(created.json))
  }
}

console.log('\n→ Login: fornecedor@plataforma.com ou cliente@plataforma.com / Demo2026!\n')
