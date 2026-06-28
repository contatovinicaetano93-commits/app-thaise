import Link from 'next/link'
import type { ReactNode } from 'react'
import { BRAND } from '@/lib/brand'
import { PublicLegalFooter } from '@/components/legal/PublicLegalFooter'

interface LegalPageLayoutProps {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header
        className="border-b border-[var(--border)] px-6 py-5"
        style={{ background: 'var(--estlar-obsidian)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="group">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--estlar-titanium)] group-hover:text-[var(--estlar-sand)] transition-colors">
              {BRAND.name}
            </p>
            <p className="text-sm text-[var(--estlar-sand)] mt-0.5">{BRAND.subtitle}</p>
          </Link>
          <Link
            href="/intake"
            className="text-xs font-medium transition-colors hover:opacity-80 shrink-0"
            style={{ color: 'var(--estlar-wine-light)' }}
          >
            Mapeamento
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
        <h1 className="font-display text-3xl font-light text-gray-900 tracking-wide mb-2">{title}</h1>
        <p className="text-sm text-[var(--estlar-titanium)] mb-10">Última atualização: {updatedAt}</p>

        <article className="prose prose-sm max-w-none prose-headings:font-light prose-headings:tracking-wide prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-[var(--estlar-wine)]">
          {children}
        </article>

        <PublicLegalFooter className="mt-12 pt-8 border-t border-[var(--border)]" />
      </main>
    </div>
  )
}
