'use client'

import { useState } from 'react'
import { MessageCircle, X, Sparkles } from 'lucide-react'
import { assistantApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'

export function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask() {
    setLoading(true)
    try {
      const r = await assistantApi.suggest()
      setReply(r.message)
    } catch {
      setReply('Cadastre fornecedores ativos e crie seu primeiro empreendimento.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); ask() }}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center"
        title="Assistente — o que faço agora?"
      >
        <MessageCircle size={20} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Sparkles size={16} className="text-violet-600" />
          Assistente
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <p className="text-sm text-gray-600 mb-3 min-h-[3rem]">
        {loading ? 'Analisando...' : reply || 'Pergunte o que fazer agora.'}
      </p>
      <Button className="px-3 py-1.5 text-xs" onClick={ask} disabled={loading}>O que faço agora?</Button>
    </div>
  )
}
