'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Route Error]', error) }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <h2 className="font-bold text-gray-900 mb-1">Erro ao carregar</h2>
        <p className="text-sm text-gray-500 mb-5">{error.message || 'Tente recarregar a página.'}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
