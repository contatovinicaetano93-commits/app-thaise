import { startOrderWorker } from './order.worker'
import { startNotifyWorker } from './notify.worker'

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  console.error('REDIS_URL não configurada. Worker não iniciado.')
  process.exit(1)
}

startOrderWorker()
startNotifyWorker()

console.info('[workers] Todos os workers iniciados (orders, notifications)')
