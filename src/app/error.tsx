'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center p-6">
      <div className="text-center animate-fade-in max-w-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Algo deu errado</h1>
        <p className="text-sm text-gray-500 mb-6">{error.message || 'Erro inesperado. Tente novamente.'}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw size={15} />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
