# Changelog — Plataforma Thaise

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
