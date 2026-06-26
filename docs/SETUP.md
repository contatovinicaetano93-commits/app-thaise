# Setup em 3 passos — Estlar Hub

Projeto Supabase: **jaokeypptatywvarwlao**

## Passo 1 — Variáveis de ambiente

```bash
cp .env.example .env.local
npm run setup:env
```

Preencha no `.env.local`:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API → Publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Secret |

## Passo 2 — Schema (tabelas)

**Opção A — SQL Editor (recomendado agora)**

1. Abra: https://supabase.com/dashboard/project/jaokeypptatywvarwlao/sql/new
2. Copie todo o conteúdo de `supabase/schema.sql`
3. Clique **Run**

**Opção B — Automático (com senha do banco)**

1. Supabase → Settings → Database → Connection string → URI
2. Adicione no `.env.local`: `DATABASE_URL=postgresql://...`
3. Rode: `npm run setup:schema`

## Passo 3 — Usuário gestor

Configure no `.env.local`:

```
SEED_GESTOR_EMAIL=thaise@plataforma.com
SEED_GESTOR_PASSWORD=SuaSenhaSegura123!
```

Rode:

```bash
npm run seed
```

Ou tudo de uma vez (após schema aplicado):

```bash
npm run setup
```

## Testar

```bash
npm run dev
```

→ http://localhost:3000/login

## Troubleshooting

| Erro | Solução |
|---|---|
| Tabelas não encontradas | Rode `schema.sql` no SQL Editor |
| Invalid API key | Regenere a secret key no Supabase |
| Email not confirmed | O seed já confirma automaticamente |
| Login não redireciona | Reinicie `npm run dev` após mudar `.env.local` |
