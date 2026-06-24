import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.9'],
  },
}

const BASE = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  const health = http.get(`${BASE}/api/health`)
  check(health, { 'health ok': r => r.status === 200 })

  const dashboard = http.get(`${BASE}/api/dashboard`)
  check(dashboard, { 'dashboard responds': r => r.status === 200 })

  sleep(1)
}
