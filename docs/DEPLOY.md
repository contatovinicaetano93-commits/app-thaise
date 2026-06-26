# Deploy — Estlar Hub

Guia para colocar o app em produção (Vercel + Supabase).

**Guia completo Vercel + Redis:** [docs/VERCEL-REDIS.md](VERCEL-REDIS.md)

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. **SQL Editor** → execute **nesta ordem exata** (banco novo):
   1. `supabase/schema.sql` — tabelas base
   2. `supabase/migration_realtime.sql` — publicações Realtime
   3. `supabase/migration_rls_by_role.sql` — ⚠️ **obrigatório** — políticas RLS por role (gestor/fornecedor/cliente)
   4. `supabase/migration_storage_checklist.sql` — bucket storage para checklist
   5. `supabase/migration_pipeline.sql` — tabelas do pipeline comercial (opportunities)
   6. `supabase/migration_estlar_eos.sql` — Estlar EOS: weekly_reports, welcome_kits, diário de obra, cotações, aditivos
   7. `supabase/migration_indexes_scale.sql` — índices de performance
   8. `supabase/migration_scale_webhooks.sql` — tabela webhooks
   9. `supabase/migration_resilience_memory.sql` — processed_jobs (idempotência)
   10. `supabase/migration_rls_tighten.sql` — RLS restritivo em webhooks, job_logs, agent_insights
   11. `supabase/migration_qcps_projects.sql` + `supabase/migration_phase2.sql` — se banco legado

   > ⚠️ Pular `migration_rls_by_role.sql` deixa todas as tabelas abertas para qualquer usuário autenticado. Pular `migration_estlar_eos.sql` ou `migration_pipeline.sql` causa erros 500 silenciosos nas features EOS e Pipeline.
3. **Authentication** → habilite Email
4. Crie usuários em **Authentication → Users** com metadata:

```json
{ "role": "gestor", "full_name": "Thaise Resende" }
```

Roles válidas: `gestor` | `fornecedor` | `cliente`

5. Copie as chaves em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` / `secret` → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Vercel (app Next.js)

1. Importe o repositório: [github.com/contatovinicaetano93-commits/app-thaise](https://github.com/contatovinicaetano93-commits/app-thaise)
2. Framework: **Next.js** (detectado automaticamente)
3. Adicione as variáveis de ambiente:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública (publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Jobs em background e agente AI |
| `REDIS_URL` | Não* | Fila BullMQ — use Upstash `rediss://...` |
| `OPENAI_API_KEY` | Não | Insights em linguagem natural no agente |
| `CRON_SECRET` | Sim* | Protege rotas `/api/cron/*` (gerar com `openssl rand -hex 32`) |

\* Sem `CRON_SECRET`, os crons semanais (relatório 360, welcome kit) retornam 401 na Vercel.

\* Sem Redis, jobs rodam inline — funciona para MVP. Ver [VERCEL-REDIS.md](VERCEL-REDIS.md).

4. Região recomendada: **São Paulo (gru1)** — já em `vercel.json`
5. Deploy → acesse `https://seu-app.vercel.app`

### Redirect URL (Auth)

No Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://seu-app.vercel.app`
- **Redirect URLs**: `https://seu-app.vercel.app/**`

## 3. Worker BullMQ (produção com filas)

Ver passo a passo: **[VERCEL-REDIS.md → Passo 4](VERCEL-REDIS.md#passo-4--worker-no-railway)**

Resumo:

1. Upstash Redis → `REDIS_URL` na Vercel
2. Railway → `npm run worker` (usa `railway.toml` na raiz)
3. Validar: `curl https://seu-app.vercel.app/api/health` → `"redis":"ok"`

## 4. Secrets no GitHub

**Settings → Secrets and variables → Actions** (se usar deploy automático):

| Secret | Uso |
|---|---|
| `VERCEL_TOKEN` | Deploy automático via `.github/workflows/deploy.yml` |
| `VERCEL_ORG_ID` | Opcional — `vercel link` local |
| `VERCEL_PROJECT_ID` | Opcional — `vercel link` local |
| `NEXT_PUBLIC_SUPABASE_URL` | CI / preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | CI / preview |

> `SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` **somente** na Vercel/worker — nunca no repositório.

## 5. Checklist pós-deploy

- [ ] Login funciona com usuário gestor
- [ ] Criar fornecedor, cliente, empreendimento
- [ ] Checklist da fase A completa → avançar para B
- [ ] Criar pedido vinculado ao empreendimento
- [ ] Aprovar pedido → verificar `job_logs` no Supabase
- [ ] Entregar pedido → QCPS do fornecedor atualizado

## 6. Desenvolvimento local

```bash
cp .env.example .env.local
# preencher chaves

npm install
npm run dev        # http://localhost:3000
npm run setup:redis  # testar Upstash (opcional)
npm run worker     # terminal separado, se REDIS_URL configurada
npm run build      # validar produção
```
