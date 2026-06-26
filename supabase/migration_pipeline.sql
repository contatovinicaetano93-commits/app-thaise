-- Pipeline Comercial Thaise — oportunidades antes de virar cliente/empreendimento
-- Rode no SQL Editor após migration_rls_by_role.sql (idempotente)

create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text not null,
  phone text not null,
  source text not null check (source in ('whatsapp','indicacao','instagram','parceiro','evento','outro')) default 'whatsapp',
  budget_estimate numeric(14,2),
  stage text not null check (stage in (
    'primeiro_contato','briefing','viabilidade_previa','proposta','contrato','ganho','perdido'
  )) default 'primeiro_contato',
  notes text,
  lost_reason text,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

create index if not exists idx_opportunities_stage on opportunities(stage, updated_at desc);
create index if not exists idx_opportunities_active on opportunities(updated_at desc)
  where stage not in ('ganho', 'perdido');

create trigger opportunities_updated_at
  before update on opportunities
  for each row execute function update_updated_at();

alter table opportunities enable row level security;

drop policy if exists "gestor opportunities all" on opportunities;
create policy "gestor opportunities all" on opportunities
  for all using (current_user_role() = 'gestor');

-- activity_events: incluir opportunity na timeline
alter table activity_events drop constraint if exists activity_events_entity_type_check;
alter table activity_events add constraint activity_events_entity_type_check
  check (entity_type in ('project','order','supplier','client','product','opportunity'));

-- Realtime
do $$
begin
  alter publication supabase_realtime add table opportunities;
exception when duplicate_object then null;
end $$;
