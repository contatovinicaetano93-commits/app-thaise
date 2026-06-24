# Runbook — Plataforma Thaise

## Health check

```bash
curl http://localhost:3000/api/health
```

Esperado: `{ "ok": true, "data": { "status": "ok", "db": "ok", ... } }`

## Jobs falhando

1. Acesse **Jobs / Fila** (`/jobs`) como gestor
2. Clique **Reprocessar** no job com status `failed`
3. Verifique `job_logs` e `processed_jobs` no Supabase

## Sem Redis

- Jobs rodam **inline** automaticamente
- `REDIS_URL` vazio = fallback seguro (não trava a API)

## Memória / timeline vazia

Rode a migração de memória no Supabase SQL Editor:

```
supabase/migration_resilience_memory.sql
```

Eventos são gravados em `activity_events` e `order_status_log`.

## Idempotência

Jobs `order.approved` e `order.delivered` usam chave `job_type:order_id` em `processed_jobs` — não processam duas vezes.

## Rollback deploy

1. Vercel → Deployments → promote anterior
2. Verificar `/api/health`

## Contatos de incidente

- Gestor: thaise@plataforma.com
- Logs: Supabase → Table Editor → `job_logs`, `activity_events`
