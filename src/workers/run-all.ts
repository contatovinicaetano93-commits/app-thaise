import { startOrderWorker } from './order.worker'
import { startScoringWorker } from './scoring.worker'
import { startNotifyWorker } from './notify.worker'

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  console.error('REDIS_URL não configurada. Worker não iniciado.')
  process.exit(1)
}

startOrderWorker()
startScoringWorker()
startNotifyWorker()

console.info('[workers] Todos os workers iniciados (orders, scoring, notifications)')
