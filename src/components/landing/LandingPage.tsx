'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { DATA_CONTROLLER } from '@/lib/legal/constants'

const METHOD_CYCLES = [
  {
    step: '01',
    title: 'Concepção e Viabilidade',
    description:
      'Definição da vocação do ativo, prevenção de passivos estruturais e financeiros e concepção do conceito do projeto.',
  },
  {
    step: '02',
    title: 'Decisão Estratégica',
    description:
      'Validação via Método QCPS — Qualidade, Custo-benefício, Prazo, Sustentabilidade e Inovação — blindando o projeto contra escolhas sem estratégia.',
  },
  {
    step: '03',
    title: 'Direção de Execução',
    description:
      'Coordenação contínua entre conceito e realidade tátil, com monitoramento preciso de cada etapa.',
  },
  {
    step: '04',
    title: 'Consolidação do Ativo',
    description:
      'Entrega de um produto final inovador e responsável, atribuindo estética e funcionalidade a uma experiência de excelência.',
  },
]

const HUB_MODULES = [
  {
    title: 'Pipeline de Projetos',
    description: 'Acompanhamento estruturado do percurso — da oportunidade à consolidação do ativo.',
  },
  {
    title: 'Método QCPS',
    description: 'Decisões embasadas em qualidade, custo-benefício, prazo, sustentabilidade e inovação.',
  },
  {
    title: 'Relatórios Semanais',
    description: 'Consolidação precisa toda sexta-feira — o que foi feito, o que vem a seguir, dashboards e observações.',
  },
  {
    title: 'Curadoria e Briefing',
    description: 'Dossiês de viabilidade e direção de arte que unem rigor de dados e sensibilidade espacial.',
  },
]

const AUDIENCE = [
  'Investidores institucionais',
  'Desenvolvedores imobiliários',
  'Hotelaria e long stay',
  'Incorporadoras',
  'Family offices',
]

function EstlarLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
      <path
        d="M16 6 L19.5 14 L28 14 L21.25 19 L23.5 27 L16 22.5 L8.5 27 L10.75 19 L4 14 L12.5 14 Z"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
      />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  )
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--estlar-obsidian)] text-[var(--estlar-linen)] selection:bg-[var(--estlar-wine)]/30">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[var(--estlar-obsidian)]/90 backdrop-blur-md border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <EstlarLogo className="h-7 w-7 text-[var(--estlar-linen)] transition-colors group-hover:text-[var(--estlar-wine-light)]" />
            <span className="font-display text-lg tracking-[0.2em] uppercase text-[var(--estlar-linen)]">
              Estlar
            </span>
          </Link>
          <nav className="hidden items-center gap-10 md:flex">
            <a href="#metodo" className="text-xs tracking-[0.15em] uppercase text-[var(--estlar-titanium)] transition-colors hover:text-[var(--estlar-linen)]">
              Método
            </a>
            <a href="#hub" className="text-xs tracking-[0.15em] uppercase text-[var(--estlar-titanium)] transition-colors hover:text-[var(--estlar-linen)]">
              Plataforma
            </a>
            <a href="#contato" className="text-xs tracking-[0.15em] uppercase text-[var(--estlar-titanium)] transition-colors hover:text-[var(--estlar-linen)]">
              Contato
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-xs tracking-[0.12em] uppercase text-[var(--estlar-titanium)] transition-colors hover:text-[var(--estlar-linen)] sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 border border-[var(--estlar-linen)]/20 px-5 py-2.5 text-xs tracking-[0.12em] uppercase transition-all hover:border-[var(--estlar-wine-light)] hover:bg-[var(--estlar-wine)]/10"
            >
              Iniciar mapeamento
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pb-20 pt-32 lg:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--estlar-obsidian)] via-transparent to-[var(--estlar-obsidian)]" />
          <div className="absolute left-1/2 top-0 h-[60vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--estlar-wine)]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 lg:px-10">
          <p className="mb-8 text-xs tracking-[0.35em] uppercase text-[var(--estlar-titanium)] animate-fade-in">
            Hub de Arquitetura
          </p>
          <h1 className="font-display max-w-4xl text-4xl font-light leading-[1.15] tracking-wide text-[var(--estlar-linen)] sm:text-5xl lg:text-6xl animate-fade-in">
            Onde a performance
            <br />
            <span className="text-[var(--estlar-sand)]">e o design</span> se complementam
          </h1>
          <p className="mt-10 max-w-xl text-base leading-relaxed text-[var(--estlar-titanium)] lg:text-lg animate-fade-in">
            {BRAND.manifesto}
          </p>
          <div className="mt-12 flex flex-wrap gap-4 animate-fade-in">
            <Link
              href="/intake"
              className="inline-flex items-center gap-3 bg-[var(--estlar-wine)] px-8 py-4 text-xs tracking-[0.15em] uppercase text-[var(--estlar-linen)] transition-colors hover:bg-[var(--estlar-wine-light)]"
            >
              Solicitar mapeamento
              <ChevronRight size={16} />
            </Link>
            <a
              href="#manifesto"
              className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 text-xs tracking-[0.15em] uppercase text-[var(--estlar-titanium)] transition-colors hover:border-white/25 hover:text-[var(--estlar-linen)]"
            >
              Conhecer a Estlar
            </a>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="border-t border-white/5 bg-[var(--estlar-obsidian-soft)] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <p className="text-xs tracking-[0.35em] uppercase text-[var(--estlar-wine-light)]">
                Manifesto
              </p>
            </div>
            <div className="lg:col-span-8">
              <blockquote className="font-display text-2xl font-light leading-relaxed tracking-wide text-[var(--estlar-sand)] sm:text-3xl lg:text-[2rem] lg:leading-snug">
                A construção civil opera em extremos: a rigidez das planilhas de um lado,
                a abstração do design de outro. A Estlar existe na intersecção exata desses polos.
              </blockquote>
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--estlar-titanium)]">
                Como plataforma de inteligência criativa e construtiva, transformamos projetos em ativos
                através da tecnologia e inovação — sob a curadoria do olhar e sensibilidade humana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Force */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 max-w-xl">
            <p className="mb-4 text-xs tracking-[0.35em] uppercase text-[var(--estlar-titanium)]">
              O Partido
            </p>
            <h2 className="font-display text-3xl font-light tracking-wide text-[var(--estlar-linen)] lg:text-4xl">
              Duas forças, um equilíbrio
            </h2>
          </div>
          <div className="grid gap-px bg-white/5 md:grid-cols-2">
            <div className="bg-[var(--estlar-obsidian)] p-10 lg:p-14">
              <p className="mb-6 text-xs tracking-[0.3em] uppercase text-[var(--estlar-titanium)]">
                A Força Sólida
              </p>
              <h3 className="font-display mb-6 text-2xl font-light text-[var(--estlar-linen)]">
                Estrutura e método
              </h3>
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--estlar-titanium)]">
                {['Planejamento baseado em dados', 'Geometrias funcionais e minimalismo', 'Visão corporativa e escalabilidade', 'Entrega impecável'].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-px w-4 shrink-0 bg-[var(--estlar-titanium)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[var(--estlar-obsidian-soft)] p-10 lg:p-14">
              <p className="mb-6 text-xs tracking-[0.3em] uppercase text-[var(--estlar-wine-light)]">
                A Força Fluida
              </p>
              <h3 className="font-display mb-6 text-2xl font-light text-[var(--estlar-linen)]">
                Sensorial e curadoria
              </h3>
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--estlar-titanium)]">
                {['Estética autoral e valorização do sutil', 'Conexões humanas e hospitalidade', 'Intuição refinada e disciplina emocional', 'Arte, textura e luz rasante'].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-px w-4 shrink-0 bg-[var(--estlar-wine-light)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Method */}
      <section id="metodo" className="border-t border-white/5 bg-[var(--estlar-sand)] py-24 text-[var(--estlar-obsidian)] lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 text-xs tracking-[0.35em] uppercase text-[var(--estlar-wine)]">
                Matriz de Atuação
              </p>
              <h2 className="font-display text-3xl font-light tracking-wide lg:text-4xl">
                Quatro ciclos de consolidação
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[var(--estlar-obsidian)]/70">
              O valor da Estlar não reside apenas na execução da tarefa, mas na estruturação da decisão.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD_CYCLES.map(cycle => (
              <article key={cycle.step} className="group border-t border-[var(--estlar-obsidian)]/15 pt-8">
                <span className="font-display text-4xl font-light text-[var(--estlar-wine)]/40 transition-colors group-hover:text-[var(--estlar-wine)]">
                  {cycle.step}
                </span>
                <h3 className="font-display mt-4 text-lg font-medium tracking-wide">
                  {cycle.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--estlar-obsidian)]/65">
                  {cycle.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Hub */}
      <section id="hub" className="py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="mb-4 text-xs tracking-[0.35em] uppercase text-[var(--estlar-titanium)]">
                Refúgio Digital
              </p>
              <h2 className="font-display text-3xl font-light tracking-wide text-[var(--estlar-linen)] lg:text-4xl">
                Uma galeria de acompanhamento de patrimônio
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--estlar-titanium)]">
              Comunicação assíncrona, precisa e elegante. Atualizações concentradas na plataforma —
              respeitando o tempo do investidor e a autoridade da marca.
            </p>
          </div>
          <div className="grid gap-px bg-white/5 sm:grid-cols-2">
            {HUB_MODULES.map(mod => (
              <div
                key={mod.title}
                className="bg-[var(--estlar-obsidian-soft)] p-8 transition-colors hover:bg-[var(--estlar-obsidian)] lg:p-10"
              >
                <h3 className="font-display text-lg font-light tracking-wide text-[var(--estlar-linen)]">
                  {mod.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--estlar-titanium)]">
                  {mod.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="border-t border-white/5 py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="mb-4 text-xs tracking-[0.35em] uppercase text-[var(--estlar-titanium)]">
                Posicionamento
              </p>
              <h2 className="font-display text-3xl font-light tracking-wide text-[var(--estlar-linen)] lg:text-4xl">
                Plataforma de projeto, curadoria e inteligência de desenvolvimento
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="mb-8 text-sm leading-relaxed text-[var(--estlar-titanium)]">
                Integração silenciosa de tecnologia — IA, data-driven, automação — com curadoria humana
                de altíssimo padrão criativo. Atuamos como complemento, elevando o padrão de mercado
                sem substituir parceiros e profissionais.
              </p>
              <div className="flex flex-wrap gap-3">
                {AUDIENCE.map(item => (
                  <span
                    key={item}
                    className="border border-white/10 px-4 py-2 text-xs tracking-[0.1em] uppercase text-[var(--estlar-titanium)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="border-t border-white/5 bg-[var(--estlar-obsidian-soft)] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-10">
          <p className="mb-6 text-xs tracking-[0.35em] uppercase text-[var(--estlar-wine-light)]">
            Próximo passo
          </p>
          <h2 className="font-display mx-auto max-w-2xl text-3xl font-light tracking-wide text-[var(--estlar-linen)] lg:text-4xl">
            Estruture a decisão antes de executar
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-[var(--estlar-titanium)]">
            O mapeamento inicial leva cerca de dois minutos. Nossa equipe avalia a compatibilidade
            entre sua demanda e nossa expertise antes de agendar a Reunião de Imersão.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/intake"
              className="inline-flex items-center gap-3 bg-[var(--estlar-wine)] px-10 py-4 text-xs tracking-[0.15em] uppercase text-[var(--estlar-linen)] transition-colors hover:bg-[var(--estlar-wine-light)]"
            >
              Iniciar mapeamento de projeto
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="text-xs tracking-[0.12em] uppercase text-[var(--estlar-titanium)] transition-colors hover:text-[var(--estlar-linen)]"
            >
              Acesso à plataforma
            </Link>
          </div>
          <div className="mt-16 flex flex-col items-center gap-2 text-sm text-[var(--estlar-titanium)] sm:flex-row sm:justify-center sm:gap-8">
            <a href={`mailto:${DATA_CONTROLLER.email}`} className="transition-colors hover:text-[var(--estlar-linen)]">
              {DATA_CONTROLLER.email}
            </a>
            <span className="hidden sm:inline text-white/20">·</span>
            <a href="tel:+5511911538204" className="transition-colors hover:text-[var(--estlar-linen)]">
              11 91153 8204
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-10">
          <div className="flex items-center gap-3">
            <EstlarLogo className="h-5 w-5 text-[var(--estlar-titanium)]" />
            <span className="text-xs tracking-[0.2em] uppercase text-[var(--estlar-titanium)]">
              Estlar · Hub de Arquitetura
            </span>
          </div>
          <p className="text-xs text-[var(--estlar-titanium)]/60">
            © {new Date().getFullYear()} Estlar. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
