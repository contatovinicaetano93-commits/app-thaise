'use client'

import { useState } from 'react'
import { Code2, ChevronDown, ChevronRight } from 'lucide-react'

const ENDPOINTS = [
  {
    group: 'Fornecedores',
    color: 'indigo',
    routes: [
      { method: 'GET',    path: '/api/suppliers',     desc: 'Lista todos os fornecedores', params: [{ n: 'search', t: 'string?', d: 'Filtrar por nome ou categoria' }], response: '{ ok: true, data: Supplier[], meta: { total: number } }' },
      { method: 'POST',   path: '/api/suppliers',     desc: 'Cria novo fornecedor',        body: 'name, category, contact_name, contact_email, contact_phone, website?, status, notes?', response: '{ ok: true, data: Supplier }' },
      { method: 'PATCH',  path: '/api/suppliers/:id', desc: 'Atualiza fornecedor',         body: 'Qualquer campo do Supplier (todos opcionais)', response: '{ ok: true, data: Supplier }' },
      { method: 'DELETE', path: '/api/suppliers/:id', desc: 'Remove fornecedor',           response: '{ ok: true, data: null }' },
    ],
  },
  {
    group: 'Clientes',
    color: 'emerald',
    routes: [
      { method: 'GET',    path: '/api/clients',     desc: 'Lista todos os clientes', params: [{ n: 'search', t: 'string?', d: 'Filtrar por nome, email ou empresa' }], response: '{ ok: true, data: Client[], meta: { total: number } }' },
      { method: 'POST',   path: '/api/clients',     desc: 'Cria novo cliente',       body: 'name, email, phone, company?, segment?, notes?', response: '{ ok: true, data: Client }' },
      { method: 'PATCH',  path: '/api/clients/:id', desc: 'Atualiza cliente',        body: 'Qualquer campo do Client (todos opcionais)', response: '{ ok: true, data: Client }' },
      { method: 'DELETE', path: '/api/clients/:id', desc: 'Remove cliente',          response: '{ ok: true, data: null }' },
    ],
  },
  {
    group: 'Produtos',
    color: 'amber',
    routes: [
      { method: 'GET',  path: '/api/products', desc: 'Lista produtos do catálogo', params: [{ n: 'supplier_id', t: 'uuid?', d: 'Filtrar por fornecedor' }], response: '{ ok: true, data: Product[] }' },
      { method: 'POST', path: '/api/products', desc: 'Cria novo produto',          body: 'supplier_id, name, category, price, unit, description?, min_order?, lead_time_days?, active?', response: '{ ok: true, data: Product }' },
      { method: 'PATCH',path: '/api/products/:id', desc: 'Atualiza produto',       body: 'Qualquer campo do Product (todos opcionais)', response: '{ ok: true, data: Product }' },
    ],
  },
  {
    group: 'Pedidos',
    color: 'rose',
    routes: [
      { method: 'GET',   path: '/api/orders',            desc: 'Lista pedidos com joins', params: [{ n: 'search', t: 'string?', d: 'Filtrar por cliente, fornecedor ou produto' }], response: '{ ok: true, data: Order[] }' },
      { method: 'POST',  path: '/api/orders',            desc: 'Cria novo pedido',        body: 'client_id, supplier_id, product_id, quantity, unit_price, notes?', response: '{ ok: true, data: Order }' },
      { method: 'PATCH', path: '/api/orders/:id/status', desc: 'Muda status do pedido',   body: 'status: pending|approved|processing|delivered|cancelled', response: '{ ok: true, data: Order }' },
    ],
  },
]

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100 text-blue-700',
  PATCH:  'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
}

const GROUP_COLOR: Record<string, string> = {
  indigo:  'bg-indigo-50 border-indigo-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  amber:   'bg-amber-50 border-amber-200',
  rose:    'bg-rose-50 border-rose-200',
}

export default function ApiDocsPage() {
  const [open, setOpen] = useState<string | null>(null)

  function toggle(key: string) {
    setOpen(o => o === key ? null : key)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Code2 size={18} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Docs</h2>
          <p className="text-gray-500 text-sm">Todos os endpoints disponíveis · Base URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code></p>
        </div>
      </div>

      <div className="mt-2 mb-6 bg-gray-900 rounded-xl p-4 text-xs text-gray-300 font-mono">
        <span className="text-gray-500"># Formato padrão de resposta</span><br />
        <span className="text-emerald-400">{'{ ok: true,  data: T }'}</span>{'  // sucesso'}<br />
        <span className="text-red-400">{'{ ok: false, error: string }'}</span>{'  // erro'}
      </div>

      <div className="space-y-4">
        {ENDPOINTS.map(group => (
          <div key={group.group} className={`rounded-2xl border p-1 ${GROUP_COLOR[group.color]}`}>
            <div className="px-4 py-3">
              <h3 className="font-semibold text-gray-900 text-sm">{group.group}</h3>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-50">
              {group.routes.map((route, i) => {
                const key = `${group.group}-${i}`
                const isOpen = open === key
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono w-14 text-center flex-shrink-0 ${METHOD_COLOR[route.method]}`}>
                        {route.method}
                      </span>
                      <code className="text-sm text-gray-700 font-mono flex-1">{route.path}</code>
                      <span className="text-xs text-gray-400 hidden sm:block">{route.desc}</span>
                      {isOpen ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50 space-y-3 text-xs animate-fade-in">
                        {route.params && (
                          <div>
                            <p className="font-semibold text-gray-600 mb-1">Query params</p>
                            {route.params.map(p => (
                              <div key={p.n} className="flex gap-2">
                                <code className="text-violet-700 font-mono">{p.n}</code>
                                <span className="text-gray-400">{p.t}</span>
                                <span className="text-gray-500">— {p.d}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {'body' in route && route.body && (
                          <div>
                            <p className="font-semibold text-gray-600 mb-1">Request body (JSON)</p>
                            <code className="text-gray-600">{route.body}</code>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-600 mb-1">Response</p>
                          <code className="text-emerald-700 font-mono">{route.response}</code>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
