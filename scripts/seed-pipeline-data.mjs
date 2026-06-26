#!/usr/bin/env node
/**
 * Popula apenas oportunidades demo no pipeline comercial.
 * Uso: npm run seed:pipeline
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (!existsSync(envPath)) throw new Error('.env.local não encontrado')

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim()
}

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
  Prefer: 'return=representation',
}

async function api(path, init = {}) {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const text = await res.text()
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = { message: text } }
  return { ok: res.ok, status: res.status, json }
}

async function findOne(filter) {
  const r = await api(`/rest/v1/opportunities?${filter}&select=*&limit=1`)
  const row = Array.isArray(r.json) ? r.json[0] : r.json
  return row?.id ? row : null
}

async function ensureOpportunity(data) {
  const existing = await findOne(`email=eq.${encodeURIComponent(data.email)}`)
  if (existing) {
    console.log(`  ↳ já existe: ${data.name}`)
    return existing
  }
  const r = await api('/rest/v1/opportunities', { method: 'POST', body: JSON.stringify(data) })
  const row = r.json?.[0] ?? r.json
  if (!row?.id) throw new Error(`Falha ${data.email}: ${JSON.stringify(r.json)}`)
  console.log(`  ✅ ${data.name} — ${data.stage}`)
  return row
}

const check = await api('/rest/v1/opportunities?select=id&limit=1')
if (!check.ok) {
  console.error('❌ Tabela opportunities não encontrada. Rode supabase/migration_pipeline.sql no SQL Editor.')
  process.exit(1)
}

console.log('\n🌱 Seed pipeline comercial Thaise\n')

const rows = [
  {
    name: 'Roberto Almeida',
    email: 'roberto.almeida@pipeline.demo',
    phone: '(11) 91234-5678',
    company: 'Almeida Capital',
    source: 'whatsapp',
    stage: 'primeiro_contato',
    budget_estimate: 3500000,
    notes: 'Contato via WhatsApp após post sobre obra fechada em Alphaville.',
  },
  {
    name: 'Fundo Horizonte',
    email: 'contato@fundohorizonte.pipeline.demo',
    phone: '(11) 92345-6789',
    company: 'Fundo Horizonte Investimentos',
    source: 'indicacao',
    stage: 'briefing',
    budget_estimate: 8000000,
    notes: 'Briefing agendado — perfil investidor institucional, foco residencial alto padrão.',
  },
  {
    name: 'Patrícia Souza',
    email: 'patricia.souza@pipeline.demo',
    phone: '(21) 93456-7890',
    company: 'PS Holdings',
    source: 'parceiro',
    stage: 'viabilidade_previa',
    budget_estimate: 2200000,
    notes: 'Viabilidade prévia Thaise em andamento — terreno em Angra dos Reis.',
  },
  {
    name: 'Grupo Nexus',
    email: 'investimentos@gruponexus.pipeline.demo',
    phone: '(31) 94567-8901',
    company: 'Grupo Nexus',
    source: 'evento',
    stage: 'proposta',
    budget_estimate: 12000000,
    notes: 'Proposta Obra Fechada entregue — aguardando retorno do board.',
  },
  {
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@pipeline.demo',
    phone: '(48) 95678-9012',
    company: 'Ferreira Family Office',
    source: 'instagram',
    stage: 'contrato',
    budget_estimate: 5000000,
    notes: 'Minuta contratual em revisão jurídica — fechamento previsto em 2 semanas.',
  },
]

for (const row of rows) {
  await ensureOpportunity(row)
}

console.log('\n✅ 5 oportunidades no funil → /pipeline\n')
