# Plano GTM — Estlar Hub

**Meta:** MVP comercial pronto para o **1º cliente real** até **quarta-feira**.  
**Produção:** https://app-thaise.vercel.app  
**Última atualização:** 2026-06-23

---

## Definição de pronto (go-live quarta)

| Critério | Descrição |
|----------|-----------|
| Intake legal | Formulário público com consentimento LGPD registrado |
| Convite por e-mail | Resend configurado; gestor convida cliente após convert |
| Reset de senha | Link Supabase → página `/auth/reset-password` |
| Cliente vê valor | Relatório 360 read-only no portal |
| Operação limpa | Demo removido ou isolado; smoke prod verde |

**Fora de escopo v1:** pagamento online, PDF/e-sign, portal cliente completo, worker Redis.

---

## Responsabilidades

| Área | Dev (agente) | Thaise |
|------|--------------|--------|
| Código e deploy | ✅ | — |
| Textos jurídicos finais | Template base | Revisão advogado / ajuste copy |
| Resend + `EMAIL_FROM` | Código pronto | Criar conta, keys na Vercel |
| SMTP Supabase (reset) | Redirect URL no código | Dashboard Supabase → Auth → SMTP |
| 1º cliente piloto | Smoke + suporte técnico | Contato comercial e onboarding humano |

---

## Dia 1 — Segunda (LGPD + intake)

### Dev
- [x] Plano central (`docs/GTM-PLAN.md`)
- [x] Páginas `/privacidade` e `/termos`
- [x] Checkbox LGPD no `/intake` + `intake_consent_*` no banco
- [x] Links legais no footer de intake e login
- [x] Migration `supabase/migration_gtm_lgpd.sql`

### Thaise (paralelo)
- [ ] Revisar textos em `/privacidade` e `/termos`
- [ ] Configurar Resend: `RESEND_API_KEY`, `EMAIL_FROM` na Vercel
- [ ] Supabase Auth → SMTP + redirect URLs (`/auth/reset-password`)

### Comandos
```bash
npm run setup:apply-pending   # aplica migration LGPD
npm run setup:migrations      # verifica tabelas
npm run build
npm run smoke:prod
```

---

## Dia 2 — Terça (auth + cliente)

### Dev
- [ ] Página `/auth/reset-password` + `redirectTo` no login
- [ ] Relatório 360 read-only para role `cliente`
- [ ] Fixes Sentry prioritários (realtime callback, `period.month`)

### Thaise
- [ ] Testar fluxo convite → login → reset senha
- [ ] Validar copy do e-mail de convite

---

## Dia 3 — Quarta (go-live)

### Dev
- [ ] Cleanup usuários/dados demo em produção (se aplicável)
- [ ] Smoke final + health check
- [ ] Documentar runbook do 1º cliente em `docs/DADOS-REAIS.md`

### Thaise
- [ ] Converter 1º lead real no pipeline (intake → briefing → convert)
- [ ] Enviar convite; cliente acessa hub e vê relatório
- [ ] Checklist pós-go-live (feedback, ajustes copy)

---

## Checklist env produção

| Variável | Status |
|----------|--------|
| Supabase URL + keys | ✅ |
| `ANTHROPIC_API_KEY` | ✅ |
| `CRON_SECRET` | ✅ |
| `NEXT_PUBLIC_APP_URL` | Recomendado |
| `RESEND_API_KEY` + `EMAIL_FROM` | ⏳ Thaise |
| `REDIS_URL` | Opcional |
| `OPENAI_API_KEY` | Não necessário |

---

## Referências

- Deploy: `docs/DEPLOY.md`
- Runbook: `docs/RUNBOOK.md`
- Dados reais: `docs/DADOS-REAIS.md`
- Plano overnight (técnico): `docs/OVERNIGHT-PLAN.md`

---

## Histórico

| Data | Entrega |
|------|---------|
| 2026-06-23 | Plano central criado; Dia 1 LGPD implementado |
