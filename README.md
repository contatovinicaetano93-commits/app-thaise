# Plataforma Thaise

Hub operacional para digitalizar fornecedores curados, clientes, catálogo e pedidos — com jornada de empreendimentos (Fases A–F), avaliação QCPS e agente de scoring.

**Repositório:** [github.com/contatovinicaetano93-commits/app-thaise](https://github.com/contatovinicaetano93-commits/app-thaise)

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Supabase (Postgres + Auth)
- BullMQ + Redis (opcional)
- Zod · React Hook Form · Recharts

## Funcionalidades

- **Empreendimentos** — jornada guiada A → F com checklist obrigatório
- **QCPS** — scoring em 4 dimensões (Qualidade, Custo, Prazo, Sustentabilidade)
- **Fornecedores / Clientes / Catálogo / Pedidos** — CRUD completo
- **Auth + roles** — Gestor, Fornecedor, Cliente (nav filtrada por perfil)
- **Filas** — ao aprovar/entregar pedido (BullMQ ou inline)
- **Agente AI** — recalcula QCPS + insights (OpenAI opcional)

## Premissas

| Premissa | Implementação |
|---|---|
| **Escalável** | API REST + worker separado + Postgres |
| **Guiado** | Onboarding, checklists por fase, gates de avanço |
| **AI-first** | Agente de scoring QCPS com insights |
| **Resiliente** | BullMQ com retry + fallback inline + job_logs |
| **SIPOC** | `src/lib/sipoc.ts` |

## Setup rápido

```bash
npm install
cp .env.example .env.local   # preencher chaves Supabase
```

Rodar SQL no Supabase (ver [docs/DEPLOY.md](docs/DEPLOY.md)):

- Banco novo → `supabase/schema.sql`
- Banco existente → `migration_qcps_projects.sql` + `migration_phase2.sql`

```bash
npm run dev      # http://localhost:3000
npm run worker   # opcional, com REDIS_URL
```

## Deploy

Guia completo: **[docs/DEPLOY.md](docs/DEPLOY.md)**

Resumo Vercel — variáveis obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
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
| `npm run worker` | Worker BullMQ (Redis) |
| `npm run lint` | ESLint |

## Roadmap

- [x] MVP — CRUD + QCPS + empreendimentos
- [x] Auth + roles + checklists + filas + agente
- [ ] Motor de simulação (TIR, VPL, Payback)
- [ ] Agente de compra via API de fornecedores
- [ ] Portais separados por ator (fornecedor / cliente)
