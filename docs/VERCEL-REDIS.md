# Deploy Vercel + Redis Upstash

Guia passo a passo para produção.

## Arquitetura

```
[Vercel] Next.js app ──► [Supabase] Postgres + Auth
        │
        └── enqueue ──► [Upstash Redis] ◄── [Railway] npm run worker
```

Sem Redis, jobs rodam **inline** na Vercel (funciona, mas sem fila dedicada).

---

## Passo 1 — Supabase (se ainda não fez)

1. SQL Editor → rode na ordem:
   - `supabase/schema.sql`
   - `supabase/migration_resilience_memory.sql`
   - `supabase/migration_scale_webhooks.sql`
2. Auth → URL Configuration (após ter URL da Vercel):
   - **Site URL**: `https://SEU-APP.vercel.app`
   - **Redirect URLs**: `https://SEU-APP.vercel.app/**`

---

## Passo 2 — Upstash Redis

1. Acesse [console.upstash.com](https://console.upstash.com)
2. **Create Database** → região **São Paulo (sa-east-1)** ou mais próxima
3. Em **Details** → copie **Redis URL** (formato `rediss://default:...@...upstash.io:6379`)
4. Guarde para Vercel e Railway

Teste local:

```bash
# .env.local
REDIS_URL=rediss://default:SEU_TOKEN@SEU_HOST.upstash.io:6379

npm run setup:redis
npm run worker   # terminal 2
```

---

## Passo 3 — Vercel

### Via dashboard (recomendado)

1. [vercel.com/new](https://vercel.com/new) → importe `contatovinicaetano93-commits/app-thaise`
2. Framework: **Next.js** (auto)
3. **Environment Variables** (Production + Preview):

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jaokeypptatywvarwlao.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sua publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | sua secret key |
| `REDIS_URL` | URL Upstash `rediss://...` |
| `OPENAI_API_KEY` | opcional |

4. **Deploy**

### Via CLI

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.vercel.local   # opcional
npx vercel --prod
```

---

## Passo 4 — Worker no Railway

A Vercel **não** roda processos longos — o worker BullMQ vai no Railway.

1. [railway.app/new](https://railway.app/new) → **Deploy from GitHub** → este repo
2. **Settings**:
   - **Start Command**: `npm run worker`
   - **Root Directory**: `/` (raiz)
3. **Variables** (mesmas do worker, sem chaves públicas Next):

```
REDIS_URL=rediss://...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://jaokeypptatywvarwlao.supabase.co
```

4. Deploy → logs devem mostrar `[worker] BullMQ order worker rodando...`

O arquivo `railway.toml` na raiz já configura o start command.

---

## Passo 5 — Validar produção

```bash
curl https://SEU-APP.vercel.app/api/health
```

Esperado: `"db":"ok"`, `"redis":"ok"` (se REDIS_URL na Vercel).

Checklist:

- [ ] Login em `https://SEU-APP.vercel.app/login`
- [ ] Dashboard carrega dados reais
- [ ] Aprovar pedido → `job_logs` com status `completed`
- [ ] Worker Railway processa (se Redis configurado)
- [ ] `/api/health` → redis ok

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Login redireciona errado | Supabase Auth → Site URL = URL Vercel |
| `redis: error` no health | `REDIS_URL` com `rediss://` na Vercel |
| Jobs ficam `pending` | Worker Railway não está rodando |
| Jobs duplicados | Idempotência em `processed_jobs` — OK |
| 429 na API | Rate limit 120/min — normal sob carga |

---

## Custos estimados (MVP)

| Serviço | Plano |
|---------|-------|
| Vercel | Hobby (grátis) |
| Supabase | Free tier |
| Upstash | Free tier (10k cmds/dia) |
| Railway | ~$5/mês worker |
