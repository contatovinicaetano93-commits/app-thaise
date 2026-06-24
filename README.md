# Plataforma Thaise

Hub operacional para digitalizar fornecedores curados, clientes, catálogo e pedidos — com jornada de empreendimentos (Fases A–F) e avaliação QCPS.

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Supabase (Postgres)
- Zod · React Hook Form · Recharts

## Premissas arquiteturais

| Premissa | Status MVP |
|---|---|
| **Escalável** | API REST separada do frontend (`/api/*` + `lib/api.ts`) — pronto para workers e NestJS |
| **Guiado** | Onboarding + fases A–F + stepper visual |
| **AI-first** | Estrutura preparada — agente de compra e scoring automático na Fase 2 |
| **Resiliente** | Respostas padronizadas, error boundaries, middleware auth-ready |
| **SIPOC** | Mapeamento em `src/lib/sipoc.ts` |

## SIPOC

| Papel | Entidade | Função |
|---|---|---|
| **S** — Fornecedores | `suppliers` | Entradas qualificadas (curadoria) |
| **I** — Entradas | `products`, `projects` | Catálogo e dados do empreendimento |
| **P** — Processo | Fases A–F, `orders`, QCPS | Fluxo operacional e avaliação |
| **O** — Saídas | Pedidos entregues, scores | Valor entregue + retroalimentação |
| **C** — Clientes | `clients` | Destinatário final |

## Setup

```bash
npm install
cp .env.example .env.local   # preencher chaves Supabase
```

Rodar `supabase/schema.sql` no SQL Editor do Supabase (ou `migration_qcps_projects.sql` se o banco já existia).

```bash
npm run dev
```

## Estrutura

```
src/
├── app/(app)/     # páginas autenticadas
├── app/api/       # API REST (Route Handlers)
├── components/    # UI e formulários
├── lib/           # api client, qcps, phases, sipoc
└── types/         # tipos do banco
supabase/          # schema SQL
```

## Roadmap

1. Auth (Supabase) + roles (Gestor / Fornecedor / Cliente)
2. BullMQ — filas assíncronas ao aprovar pedidos
3. Motor de simulação (TIR, VPL, Payback)
4. Agente de compra via API de fornecedores
