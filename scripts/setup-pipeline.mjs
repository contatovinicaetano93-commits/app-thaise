#!/usr/bin/env node
/**
 * Aplica migration_pipeline.sql e popula oportunidades demo.
 * Uso: npm run setup:pipeline
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: true })
    child.on('close', code => (code === 0 ? resolvePromise() : reject(new Error(`${cmd} exit ${code}`))))
  })
}

console.log('\n🚀 Setup Pipeline Comercial Thaise\n')

try {
  await run('node', ['scripts/apply-migration.mjs', 'supabase/migration_pipeline.sql'])
} catch {
  console.log('ℹ️  Migration manual: cole supabase/migration_pipeline.sql no SQL Editor se ainda não rodou.\n')
}

await run('node', ['scripts/seed-pipeline-data.mjs'])
console.log('\n✅ Pipeline pronto → http://localhost:3000/pipeline\n')
