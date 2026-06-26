## 2026-06-23 — Sprint segurança e hardening

### Segurança
- `createServiceClient()` sem fallback para anon key
- IDOR corrigido em `/api/activity` e `/api/orders/[id]/history` com `assertEntityAccess`
- Rotas de agents e resumo/risco restritas a gestor
- Middleware: 401 em APIs sem sessão; profile ausente → `/onboarding`
- `AuthProvider`: não assume gestor durante loading
- Migration `migration_rls_tighten.sql` — RLS em webhooks, job_logs, agent_insights, processed_jobs

### Consistência
- Middleware com guard central para `/api/*`
- `database.ts`: tabela `quotations` alinhada ao schema
- Busca: produtos visíveis para cliente via RLS
- `CRON_SECRET` documentado em DEPLOY.md

### Ops
- BullMQ: `job_logs` atualizado pelo worker com `jobLogId`
- Rate limit dedicado no intake (5 req/min por IP)
- CI: `npm run lint` no pipeline

## 2026-06-26 — Overnight release

### Segurança
- APIs migradas para `createSupabaseServer()` (sessão + RLS)
- Health check usa service role
- Gates de validação usam service role

### Estlar EOS
- Formulário público `/intake`
- Relatório 360 semanal `/reports/weekly`
- Diário de obra, aditivos, cotações, welcome kit
- Cron semanal (`CRON_SECRET` + Vercel cron)
- Migration `migration_estlar_eos.sql`

### UX
- Esqueci minha senha no login
- Convidar usuário (`/users`)
- Relatório IA dedicado (`/reports`)
- Botão Sair visível
- Pipeline comercial Kanban

### Ops
- Abstração de e-mail (`lib/notify/email.ts`) — Resend opcional
- Script `cleanup:demo` (dry-run)
- Smoke test estendido
- `verify-migrations` inclui tabelas Estlar

### Docs
- `docs/OVERNIGHT-PLAN.md`
- `docs/DADOS-REAIS.md`
