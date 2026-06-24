#!/usr/bin/env node
/** Testa se as chaves Supabase batem com o projeto. */
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

console.log('\n🔍 Verificando Supabase...\n')
console.log(`   URL: ${url}`)

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
})

if (res.ok || res.status === 404) {
  console.log('✅ Service role key válida para este projeto\n')
} else {
  const body = await res.text()
  console.log('❌ Chave inválida para este projeto!\n')
  console.log('   A URL e a SUPABASE_SERVICE_ROLE_KEY precisam ser do MESMO projeto.')
  console.log('   Pegue a secret key em:')
  console.log('   https://supabase.com/dashboard/project/jaokeypptatywvarwlao/settings/api\n')
  if (body) console.log(`   Resposta: ${body.slice(0, 120)}\n`)
  process.exit(1)
}
