#!/usr/bin/env node
/**
 * Testa conexão Redis (Upstash) para BullMQ.
 * Uso: npm run setup:redis
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const url = process.env.REDIS_URL

console.log('\n🔴 Redis / Upstash — Plataforma Thaise\n')

if (!url) {
  console.log('⚪ REDIS_URL não configurada')
  console.log('   Jobs rodam inline na API (OK para MVP)')
  console.log('\n   Para filas em produção:')
  console.log('   1. https://console.upstash.com → Create Redis')
  console.log('   2. Copie a URL (rediss://...)')
  console.log('   3. Adicione REDIS_URL no .env.local e na Vercel\n')
  process.exit(0)
}

try {
  const { Queue } = await import('bullmq')
  const q = new Queue('orders-healthcheck', {
    connection: { url, maxRetriesPerRequest: null },
  })
  await q.getJobCounts()
  await q.close()
  console.log('✅ Redis conectado:', url.replace(/:[^:@]+@/, ':***@'))
  console.log('   BullMQ pronto — rode npm run worker em terminal separado\n')
} catch (e) {
  console.error('❌ Falha ao conectar Redis:', e.message)
  console.error('\n   Upstash: use a URL com TLS (rediss://)')
  console.error('   Formato: rediss://default:TOKEN@HOST:6379\n')
  process.exit(1)
}
