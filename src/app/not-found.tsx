import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <p className="text-8xl font-bold text-gray-100 select-none">404</p>
        <h1 className="text-xl font-bold text-gray-900 -mt-4 mb-2">Página não encontrada</h1>
        <p className="text-sm text-gray-500 mb-8">O endereço que você acessou não existe.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <LayoutDashboard size={16} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
