import { ok } from '@/lib/api-response'

const spec = {
  openapi: '3.0.0',
  info: { title: 'Plataforma Thaise API', version: '1.0.0', description: 'Hub operacional QCPS + SIPOC' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': { get: { summary: 'Health check', tags: ['System'] } },
    '/dashboard': { get: { summary: 'Dashboard stats', tags: ['Dashboard'] } },
    '/orders': { get: { summary: 'List orders' }, post: { summary: 'Create order' } },
    '/projects': { get: { summary: 'List projects' }, post: { summary: 'Create project' } },
    '/projects/{id}/simulation': { post: { summary: 'Run TIR/VPL/Payback simulation' } },
    '/projects/{id}/summary': { post: { summary: 'AI project summary' } },
    '/projects/{id}/risk': { get: { summary: 'Risk evaluation' } },
    '/sipoc': { get: { summary: 'SIPOC metrics' } },
    '/jobs': { get: { summary: 'Job logs' } },
    '/webhooks': { get: { summary: 'List webhooks' }, post: { summary: 'Register webhook' } },
    '/assistant': { post: { summary: 'AI assistant suggest supplier' } },
  },
}

export async function GET() {
  return ok(spec)
}
