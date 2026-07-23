# Estlar Hub

Hub operacional para digitalizar fornecedores curados, clientes, catálogo e pedidos — com jornada de empreendimentos (Fases A–F), avaliação QCPS e agente de scoring.

**Repositório:** [github.com/contatovinicaetano93-commits/app-thaise](https://github.com/contatovinicaetano93-commits/app-thaise)

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Supabase (Postgres + Auth)
- BullMQ + Redis (opcional)
- Zod · React Hook Form · Recharts

## Funcionalidades

- **Fluxo mínimo 3 papéis** — obra → SKU → orçamento → pedido → entregue → relatório
- **Obras** — container com progresso % (fases A–F / escrow / QCPS = fase 2)
- **Fornecedores / Clientes / Catálogo / Pedidos** — CRUD do fluxo canônico
- **Auth + roles** — Gestor, Fornecedor, Cliente (nav filtrada por perfil)
- **Filas** — notify/order inline (BullMQ/Redis opcional)
- **Next-step** — dashboard guiado por papel

## Premissas

| Premissa | Implementação |
|---|---|
| **Escalável** | API REST + Postgres |
| **Guiado** | Onboarding + card "Próximo passo" |
| **AI-first** | Next-step + geração opcional de orçamento |
| **Resiliente** | Fallback inline + job_logs |

## Setup rápido

```bash
npm install
cp .env.example .env.local   # preencher chaves Supabase
```

Rodar SQL no Supabase (ver [docs/DEPLOY.md](docs/DEPLOY.md)):

- Banco novo → `supabase/schema.sql`
- Banco existente → migrations em `supabase/migration_*.sql` (incl. `migration_indexes_scale.sql`)

```bash
npm run dev      # http://localhost:3000
npm run worker   # opcional, com REDIS_URL
```

## Deploy

Guia completo: **[docs/DEPLOY.md](docs/DEPLOY.md)** · **Vercel + Redis:** **[docs/VERCEL-REDIS.md](docs/VERCEL-REDIS.md)**

Resumo Vercel — variáveis obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Estrutura

```
src/
├── app/(app)/       # páginas autenticadas
├── app/api/         # REST API
├── components/      # UI, forms, auth
├── lib/
│   ├── agents/      # scoring AI
│   ├── auth/        # roles
│   ├── queue/       # BullMQ
│   └── supabase/    # client SSR
└── workers/         # order.worker.ts
supabase/            # schema + migrations
docs/                # deploy
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run worker` | Workers BullMQ (orders + scoring + notify) |
| `npm run worker:orders` | Apenas worker de pedidos |
| `npm run lint` | ESLint |

## Roadmap

- [x] Fluxo mínimo 3 papéis (obra → SKU → orçamento → pedido → relatório)
- [ ] Escrow / pagamentos (fase 2)
- [ ] QCPS + scoring AI (fase 2)
- [ ] Fases A–F + checklist com evidências (fase 2)
- [ ] NestJS hub (quando escala exigir)
- [ ] Agente de compra via API de fornecedores externos
