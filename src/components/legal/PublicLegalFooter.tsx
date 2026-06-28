import Link from 'next/link'
import { BRAND } from '@/lib/brand'

interface PublicLegalFooterProps {
  className?: string
}

export function PublicLegalFooter({ className = '' }: PublicLegalFooterProps) {
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        <Link href="/privacidade" className="text-[var(--estlar-titanium)] hover:text-gray-700 transition-colors">
          Política de Privacidade
        </Link>
        <span className="text-[var(--border)] hidden sm:inline">·</span>
        <Link href="/termos" className="text-[var(--estlar-titanium)] hover:text-gray-700 transition-colors">
          Termos de Uso
        </Link>
        <span className="text-[var(--border)] hidden sm:inline">·</span>
        <Link href="/login" className="text-[var(--estlar-titanium)] hover:text-gray-700 transition-colors">
          Área restrita
        </Link>
      </div>
      <p className="text-xs text-[var(--estlar-titanium)] tracking-wide">
        {BRAND.name} · {BRAND.subtitle} © {new Date().getFullYear()}
      </p>
    </div>
  )
}
