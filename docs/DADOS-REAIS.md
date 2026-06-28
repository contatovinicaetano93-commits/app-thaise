# Dados reais — Runbook do 1º cliente (Estlar Hub)

**Produção:** https://app-thaise.vercel.app  
**Intake público:** https://app-thaise.vercel.app/intake  
**Login gestor:** `thaise@plataforma.com`

---

## Checklist antes do 1º cliente

| Item | Onde configurar |
|------|-----------------|
| Migrations OK | `npm run setup:migrations` |
| Smoke prod verde | `npm run smoke:prod` |
| Redirect URLs auth | Supabase → Auth → URL Configuration: `/auth/callback`, `/auth/reset-password` |
| SMTP reset senha | Supabase → Auth → SMTP |
| E-mail convite | Vercel: `RESEND_API_KEY`, `EMAIL_FROM` |
| Textos legais | Revisar `/privacidade` e `/termos` |

---

## Fluxo ponta a ponta — 1º cliente piloto

### 1. Lead entra pelo site

1. Cliente preenche **https://app-thaise.vercel.app/intake**
2. Aceita LGPD (consentimento registrado no banco)
3. Lead aparece no **Pipeline** com score e status automático

### 2. Qualificação comercial (gestor)

1. **Pipeline** → abrir oportunidade
2. Revisar intake; ajustar stage (briefing → viabilidade → proposta → contrato)
3. Preencher **briefing** e proposta quando aplicável
4. Marcar **sinal pago** antes de converter (gate comercial)

### 3. Converter em cliente + empreendimento

1. Pipeline → **Converter**
2. Sistema cria registro em **Clientes** e **Empreendimentos**
3. Anotar e-mail exato do cliente para convite

### 4. Convidar cliente ao Hub

**Opção A — Sistema → Convidar usuário**

- Role: `cliente`
- Vincular ao `client_id` correto
- Marcar enviar e-mail (requer Resend)

**Opção B — Clientes → menu ⋮ → Criar login**

Enviar à pessoa:

```
Site: https://app-thaise.vercel.app/login
E-mail: [cadastrado no convert]
Senha: [senha inicial ou link de reset]
```

### 5. Cliente usa o portal

O cliente vê:

- **Dashboard** — visão do empreendimento
- **Empreendimentos** — fase A–F, checklist (read-only)
- **Pedidos** — acompanhamento
- **Relatório 360** — atualizações semanais **após envio pelo gestor**

### 6. Relatório 360 (valor percebido)

1. Gestor: **Relatório 360** → revisar rascunho (sexta, automático)
2. **Aprovar** → **Enviar ao cliente**
3. Cliente recebe notificação e vê em **Operação → Relatório 360**

---

## Fluxo diário (operação)

1. **Pipeline** → novos leads do intake  
2. **Converter** → cliente + empreendimento  
3. **Homologação** → aprovar fornecedor  
4. **Catálogo** → produtos do fornecedor  
5. **Pedidos** → criar e acompanhar até entregue  
6. **Convidar usuário** → login fornecedor/cliente  

---

## Reset de senha

1. Login → **Recuperar acesso** (digite o e-mail antes)
2. E-mail Supabase → link → `/auth/reset-password`
3. Definir nova senha → redireciona ao dashboard

Requer SMTP no Supabase Auth + redirect URLs configuradas.

---

## Limpar dados demo (pós-testes)

Preserva contas `@plataforma.com` usadas no smoke test.

```bash
npm run cleanup:demo                              # dry-run
CONFIRM_CLEANUP=1 npm run cleanup:demo -- --apply # aplicar
```

Remove: clientes `@demo.com`, oportunidades `.pipeline.demo`, empreendimentos/pedidos vinculados.

---

## Migrations (referência)

Ordem se ambiente novo:

1. `schema.sql`
2. `migration_realtime.sql`
3. `migration_rls_by_role.sql`
4. `migration_storage_checklist.sql`
5. `migration_pipeline.sql`
6. `migration_estlar_eos.sql`
7. `migration_rls_tighten.sql`
8. `migration_a_first.sql`
9. `migration_gtm_lgpd.sql`

Verificar: `npm run setup:migrations` · Aplicar pendentes: `npm run setup:apply-pending`

---

## Comandos úteis

```bash
npm run smoke:prod          # health + auth + LGPD + páginas públicas
npm run setup:migrations    # tabelas no Supabase
npm run build               # build local antes de deploy
```

---

## Suporte go-live (quarta)

| Problema | Ação |
|----------|------|
| Cliente não recebe convite | Verificar Resend na Vercel; testar em Sistema → e-mail |
| Reset não chega | Supabase SMTP + redirect URLs |
| Cliente não vê Relatório 360 | Gestor deve **enviar** (status `sent`); rascunho não aparece |
| Lead não entra no pipeline | Rate limit intake; conferir `/api/intake` e consentimento |

**Plano GTM completo:** `docs/GTM-PLAN.md`
