# Plano autônomo — Plataforma Thaise (overnight)

> **Objetivo:** adiantar revisão, correções, estabilização e melhorias sem pedir permissão ao usuário.  
> **Produção:** https://app-thaise.vercel.app  
> **Regra de ouro:** não commitar segredos; não fazer force push; não apagar dados reais sem backup.

---

## Regras de autonomia

### Pode fazer sem perguntar

- Corrigir bugs, lint, types, build quebrado
- Padronizar APIs para usar sessão (`createSupabaseServer`) em vez de anon key
- Commit + push na `main` (deploy Vercel)
- Rodar `npm run build`, `npm run lint`, `npm run smoke:prod`
- Criar scripts idempotentes (verify, cleanup demo)
- Documentar em `docs/` (este plano, checklists, runbook)
- Implementar features já esboçadas localmente (Estlar EOS) se build passar
- Adicionar `.env.example` faltantes (`CRON_SECRET`)
- Testes manuais via curl/scripts

### Não fazer sem confirmação explícita

- Apagar registros do banco em produção (só script local + doc)
- Rotacionar/revogar API keys
- Alterar senhas de usuários reais
- Force push, amend de commits alheios
- Integrar serviço pago novo (Resend, etc.) — deixar stub + doc de setup
- Mudanças destrutivas de schema (DROP TABLE)

### Critério de “pronto”

Cada fase termina quando: `npm run build` ✅ · commits na `main` · smoke prod documentado.

---

## Fase 0 — Baseline (30 min)

| # | Tarefa | Comando / ação |
|---|--------|----------------|
| 0.1 | Git status + diff completo | `git status`, `git diff` |
| 0.2 | Build | `npm run build` |
| 0.3 | Lint | `npm run lint` |
| 0.4 | Migrations check | `npm run setup:migrations` |
| 0.5 | Smoke prod | `npm run smoke:prod` |
| 0.6 | Registrar falhas | Atualizar seção **Log** no fim deste arquivo |

**Saída:** lista de blockers antes de codar.

---

## Fase 1 — Segurança RLS (2–3 h) 🔴

**Problema:** muitas rotas usam `createServerClient()` (anon, sem JWT) + filtro em app. Com RLS ativo, isso é frágil.

| # | Tarefa | Arquivos |
|---|--------|----------|
| 1.1 | Auditar rotas API | `grep createServerClient src/app/api` |
| 1.2 | Migrar para `createSupabaseServer()` | Todas rotas com `requireProfile`/`requireGestor` |
| 1.3 | Manter `createServiceClient()` só onde necessário | intake, cron, invite, workers |
| 1.4 | Testar por role | gestor / fornecedor / cliente via smoke script estendido |
| 1.5 | Commit | `fix: APIs usam sessão Supabase para RLS` |

**Rotas prioritárias:** `orders`, `suppliers`, `clients`, `products`, `projects`, `dashboard`, `insights`, `notifications`.

---

## Fase 2 — Estlar EOS: commit ou isolar (2–4 h) 🟡

**Estado:** código local não commitado (`migration_estlar_eos.sql`, intake, weekly reports, diary, etc.).

| # | Tarefa | Decisão autônoma |
|---|--------|------------------|
| 2.1 | Revisar diff Estlar | Se build passa → **commitar tudo** em 1–2 commits lógicos |
| 2.2 | Migration SQL | Incluir `migration_estlar_eos.sql`; atualizar `verify-migrations.mjs` |
| 2.3 | Nav + roles | Garantir rotas em `nav-config.ts` e `ROLE_ROUTES` |
| 2.4 | `CRON_SECRET` | Adicionar em `.env.example` + doc DEPLOY |
| 2.5 | Middleware | `/intake` público; cron com header secret |
| 2.6 | Se build falhar | Branch `feat/estlar-eos` + commit parcial; doc do que falta |

**Commits sugeridos:**
- `feat: módulo Estlar EOS — intake, briefing, relatório semanal`
- `chore: migration estlar_eos e verify-migrations`

---

## Fase 3 — UX operacional (1–2 h) 🟢

| # | Tarefa | Detalhe |
|---|--------|---------|
| 3.1 | Esqueci minha senha | `/login` → link → Supabase `resetPasswordForEmail` |
| 3.2 | Toast ao convidar usuário | Copiar credenciais para clipboard (opcional) |
| 3.3 | Empty states | Pipeline, pedidos, empreendimentos sem dados |
| 3.4 | Onboarding gestor | Link direto para “primeiro fornecedor” se vazio |
| 3.5 | `PageFeedHeader` | Atalho Convidar usuário no dashboard gestor |

---

## Fase 4 — Dados demo vs reais (1 h) 🟢

| # | Tarefa | Detalhe |
|---|--------|---------|
| 4.1 | Script `scripts/cleanup-demo.mjs` | Remove só registros com `@demo`, `*.pipeline.demo`, `fornecedor@plataforma.com` demo — **dry-run por padrão** |
| 4.2 | Flag `--apply` | Só com `CONFIRM_CLEANUP=1` |
| 4.3 | Doc | `docs/DADOS-REAIS.md` — guia Thaise (resumo do guia já enviado) |
| 4.4 | `package.json` | `"cleanup:demo": "node scripts/cleanup-demo.mjs"` |

**Não rodar `--apply` em prod overnight sem lista explícita.**

---

## Fase 5 — Notificações e jobs (1–2 h) 🟡

| # | Tarefa | Detalhe |
|---|--------|---------|
| 5.1 | Abstrair email | `lib/notify/email.ts` — interface + stub + doc Resend |
| 5.2 | Notificar em eventos chave | pedido aprovado, entregue, fornecedor homologado |
| 5.3 | Jobs page | Mensagem clara se Redis offline (inline OK) |
| 5.4 | `docs/VERCEL-REDIS.md` | Checklist Upstash se `REDIS_URL` vazio |

---

## Fase 6 — Qualidade e CI (1 h) 🟢

| # | Tarefa | Detalhe |
|---|--------|---------|
| 6.1 | Estender `smoke-prod.mjs` | GET `/api/reports/monthly` (gestor), `/api/users` 401 anônimo |
| 6.2 | `verify-migrations.mjs` | Incluir: `opportunities`, storage bucket, tabelas estlar |
| 6.3 | CI | Garantir build passa no GitHub Actions |
| 6.4 | Deploy | Push `main` → verificar Vercel (curl health + /login) |

---

## Fase 7 — Documentação e case (30 min) 🟢

| # | Tarefa | Arquivo |
|---|--------|---------|
| 7.1 | Atualizar CASE-RESULTADO | Marcar itens do checklist validados |
| 7.2 | Atualizar DEPLOY | Ordem completa migrations |
| 7.3 | Atualizar README | Convidar usuário, Relatório IA, Pipeline |
| 7.4 | CHANGELOG.md | Resumo da noite (criar se não existir) |

---

## Fase 8 — Melhorias opcionais (se sobrar tempo)

| # | Item | Esforço |
|---|------|---------|
| 8.1 | Deploy automático Vercel on push | Baixo |
| 8.2 | PWA / ícone app | Médio |
| 8.3 | Export PDF relatório mensal | Médio |
| 8.4 | Busca global (CommandPalette) incluir oportunidades | Baixo |
| 8.5 | Testes e2e Playwright (login gestor) | Alto — só se Fases 0–6 OK |

---

## Ordem de execução (overnight)

```
Fase 0 → Fase 1 → Fase 2 → Fase 6 (smoke) → deploy
         ↓ se Estlar bloquear
         Fase 3 + 4 + 5 em paralelo conceitual
         Fase 7 ao final
         Fase 8 se tempo
```

**Meta mínima da noite:** Fases 0, 1, 6, 7 + deploy.  
**Meta ideal:** + Fase 2 (Estlar) + Fase 3 (esqueci senha).

---

## Commits esperados (template)

```
fix: APIs usam sessão Supabase para RLS em [domínios]
feat: módulo Estlar EOS — intake, weekly reports, diary
feat: fluxo esqueci minha senha no login
chore: script cleanup demo (dry-run) e verify-migrations estendido
docs: plano overnight, dados reais, deploy migrations
test: smoke prod estendido para reports e users
```

---

## Verificação final (manhã)

Thaise / gestor deve conseguir:

1. Login em https://app-thaise.vercel.app/login  
2. Dashboard + Relatório IA  
3. Pipeline → converter lead  
4. Convidar usuário fornecedor/cliente  
5. Criar pedido → entregar → ver QCPS  
6. Sair → voltar ao login  
7. (Novo) Esqueci minha senha envia e-mail  

```bash
npm run smoke:prod
curl -s https://app-thaise.vercel.app/api/health | jq .data.status
```

---

## Log de execução (preencher durante a noite)

| Hora | Fase | Status | Commit | Notas |
|------|------|--------|--------|-------|
| 04:00 | 0 | ✅ | — | build OK |
| 04:30 | 1 | ✅ | — | APIs → createSupabaseServer, health service role |
| 05:00 | 2 | ✅ | — | Estlar EOS commitado |
| 05:30 | 3 | ✅ | — | esqueci senha, atalhos dashboard |
| 06:00 | 4 | ✅ | — | cleanup:demo dry-run |
| 06:15 | 5 | ✅ | — | lib/notify/email.ts |
| 06:30 | 6 | ✅ | — | smoke estendido, verify-migrations |
| 06:45 | 7 | ✅ | — | CHANGELOG, DADOS-REAIS, .env.example |

---

## Referências rápidas

- Gestor: `thaise@plataforma.com` / `Thaise2026!`
- Supabase SQL: https://supabase.com/dashboard/project/jaokeypptatywvarwlao/sql/new
- Migrations: `supabase/migration_*.sql`
- AGENTS.md: ler `node_modules/next/dist/docs/` antes de APIs Next novas
