-- A First: onboarding, storage RLS, webhook delivery log
-- Idempotente — rodar após migration_rls_tighten.sql

-- ── Onboarding completado (server-side) ──
alter table profiles add column if not exists onboarding_completed_at timestamptz;

-- Usuários existentes não precisam refazer onboarding
update profiles set onboarding_completed_at = coalesce(onboarding_completed_at, created_at, now())
where onboarding_completed_at is null;

-- ── Storage checklist: leitura restrita ──
drop policy if exists "authenticated checklist read" on storage.objects;

create policy "gestor checklist read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checklist-evidence'
    and exists (select 1 from profiles where id = auth.uid() and role = 'gestor')
  );

create policy "project owner checklist read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checklist-evidence'
    and exists (
      select 1 from projects p
      join profiles pr on pr.id = auth.uid()
      where pr.role = 'cliente'
      and pr.client_id = p.client_id
      and (storage.foldername(name))[2] = p.id::text
    )
  );

-- ── Webhook delivery log ──
create table if not exists webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  webhook_id uuid references webhooks(id) on delete cascade,
  event text not null,
  url text not null,
  status_code int,
  success boolean not null default false,
  attempt int not null default 1,
  error text,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_webhook_deliveries_webhook on webhook_deliveries(webhook_id, created_at desc);

alter table webhook_deliveries enable row level security;

drop policy if exists "gestor webhook_deliveries all" on webhook_deliveries;
create policy "gestor webhook_deliveries all" on webhook_deliveries
  for all using (current_user_role() = 'gestor');
