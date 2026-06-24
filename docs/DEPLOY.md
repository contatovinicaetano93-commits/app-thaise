# Deploy — Plataforma Thaise

Guia para colocar o app em produção (Vercel + Supabase).

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. **SQL Editor** → execute na ordem:
   - Banco novo: `supabase/schema.sql`
   - Banco existente: `supabase/migration_qcps_projects.sql` + `supabase/migration_phase2.sql`
3. **Authentication** → habilite Email
4. Crie usuários em **Authentication → Users** com metadata:

```json
{ "role": "gestor", "full_name": "Thaise Resende" }
```

Roles válidas: `gestor` | `fornecedor` | `cliente`

5. Copie as chaves em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca expor no client)

## 2. Vercel (app Next.js)

1. Importe o repositório: [github.com/contatovinicaetano93-commits/app-thaise](https://github.com/contatovinicaetano93-commits/app-thaise)
2. Framework: **Next.js** (detectado automaticamente)
3. Adicione as variáveis de ambiente:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Jobs em background e agente AI |
| `REDIS_URL` | Não | Fila BullMQ (sem ela, jobs rodam inline) |
| `OPENAI_API_KEY` | Não | Insights em linguagem natural no agente |

4. Deploy → acesse `https://seu-app.vercel.app`

### Redirect URL (Auth)

No Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://seu-app.vercel.app`
- **Redirect URLs**: `https://seu-app.vercel.app/**`

## 3. Worker BullMQ (opcional)

Sem Redis, pedidos aprovados/entregues são processados **inline** na API — funciona para MVP.

Para produção com filas:

1. Provisione Redis ([Upstash](https://upstash.com), Railway, etc.)
2. Configure `REDIS_URL` na Vercel
3. Rode o worker em serviço separado (Railway, Fly.io, VPS):

```bash
REDIS_URL=redis://... \
SUPABASE_SERVICE_ROLE_KEY=... \
NEXT_PUBLIC_SUPABASE_URL=... \
npm run worker
```

## 4. Secrets no GitHub

**Settings → Secrets and variables → Actions** (se usar deploy automático):

| Secret | Uso |
|---|---|
| `VERCEL_TOKEN` | Deploy via GitHub Actions (opcional) |
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
npm run worker     # terminal separado, se REDIS_URL configurada
npm run build      # validar produção
```
