#!/usr/bin/env node
/**
 * Setup completo: env → schema → gestor
 * Uso: npm run setup
 */
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const scripts = resolve(__dirname)

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [resolve(scripts, script)], { stdio: 'inherit' })
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))))
  })
}

console.log('\n🚀 Setup Plataforma Thaise\n')

await run('check-env.mjs')
await run('apply-schema.mjs')
await run('seed-gestor.mjs')

console.log('🎉 Setup concluído! Acesse http://localhost:3000/login\n')
