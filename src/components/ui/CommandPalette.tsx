'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Truck, Users, Building2, ShoppingCart, Package } from 'lucide-react'

interface SearchResults {
  suppliers: Array<{ id: string; name: string }>
  clients: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; phase: string }>
  orders: Array<{ id: string; status: string }>
  products: Array<{ id: string; name: string; category: string }>
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: 'include' })
      const json = await res.json()
      if (json.ok) setResults(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(q), 200)
    return () => clearTimeout(t)
  }, [q, search])

  function go(href: string) {
    setOpen(false)
    setQ('')
    router.push(href)
  }

  if (!open) return null

  const hasResults = results && (
    results.suppliers.length + results.clients.length + results.projects.length +
    results.orders.length + results.products.length > 0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-gray-100">
          <Search size={18} className="text-gray-400" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar fornecedores, clientes, produtos, empreendimentos..."
            className="flex-1 py-3.5 text-sm outline-none"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {loading && <p className="text-sm text-gray-400 px-3 py-4">Buscando...</p>}
          {!loading && q.length >= 2 && !hasResults && (
            <p className="text-sm text-gray-400 px-3 py-4">Nenhum resultado</p>
          )}
          {results?.suppliers.map(s => (
            <button key={s.id} type="button" onClick={() => go('/suppliers')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left">
              <Truck size={14} className="text-indigo-500" /> {s.name}
            </button>
          ))}
          {results?.clients.map(c => (
            <button key={c.id} type="button" onClick={() => go('/clients')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left">
              <Users size={14} className="text-emerald-500" /> {c.name}
            </button>
          ))}
          {results?.products.map(p => (
            <button key={p.id} type="button" onClick={() => go('/products')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left">
              <Package size={14} className="text-amber-500" /> {p.name} <span className="text-gray-400 text-xs">{p.category}</span>
            </button>
          ))}
          {results?.projects.map(p => (
            <button key={p.id} type="button" onClick={() => go('/projects')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left">
              <Building2 size={14} className="text-violet-500" /> {p.name} <span className="text-gray-400 text-xs">Fase {p.phase}</span>
            </button>
          ))}
          {results?.orders.map(o => (
            <button key={o.id} type="button" onClick={() => go('/orders')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left">
              <ShoppingCart size={14} className="text-rose-500" /> Pedido {o.id.slice(0, 8)}…
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
