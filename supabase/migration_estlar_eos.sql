-- Estlar EOS — intake, briefing, relatório 360, diário, aditivos, cotações
-- Rode após migration_pipeline.sql (idempotente)

-- Oportunidades: intake, briefing e modelo de cobrança
alter table opportunities add column if not exists intake_data jsonb;
alter table opportunities add column if not exists intake_score integer;
alter table opportunities add column if not exists intake_status text
  check (intake_status in ('pending','approved','review','rejected'));
alter table opportunities add column if not exists briefing_data jsonb;
alter table opportunities add column if not exists briefing_type text
  check (briefing_type in ('corporativo','residencial','comercial','desenvolvimento'));
alter table opportunities add column if not exists fee_model text
  check (fee_model in ('fixo','variavel','hibrido'));
alter table opportunities add column if not exists fee_fixed numeric(14,2);
alter table opportunities add column if not exists fee_variable_pct numeric(5,2);
alter table opportunities add column if not exists signal_paid boolean default false;

-- Fornecedores: tier de homologação Estlar
alter table suppliers add column if not exists homologation_tier text
  check (homologation_tier in ('A','B','C'));

-- Welcome Kit gerado na conversão
create table if not exists welcome_kits (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  content text not null,
  generated_at timestamptz default now(),
  unique(project_id)
);

-- Relatório 360 semanal
create table if not exists weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  week_label text not null,
  week_start date not null,
  completed jsonb default '[]',
  next_steps jsonb default '[]',
  risks text,
  schedule_pct integer,
  budget_status text,
  status text not null default 'draft'
    check (status in ('draft','approved','sent')),
  generated_at timestamptz default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  unique(project_id, week_start)
);

create index if not exists idx_weekly_reports_status on weekly_reports(status, week_start desc);
create index if not exists idx_weekly_reports_project on weekly_reports(project_id, week_start desc);

-- Diário de obra
create table if not exists project_diary_entries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  week_start date not null,
  planned text,
  actual text,
  risks text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, week_start)
);

create trigger project_diary_updated_at
  before update on project_diary_entries
  for each row execute function update_updated_at();

-- Termos aditivos
create table if not exists scope_amendments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  number integer not null default 1,
  description text not null,
  amount numeric(14,2) not null default 0,
  days_added integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft','approved','rejected')),
  created_at timestamptz default now(),
  approved_at timestamptz
);

create index if not exists idx_scope_amendments_project on scope_amendments(project_id, number);

-- Comparador de cotações QCPS
create table if not exists quotations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  score_q numeric(4,1) not null default 5,
  score_c numeric(4,1) not null default 5,
  score_p numeric(4,1) not null default 5,
  score_s numeric(4,1) not null default 5,
  qcps_total numeric(4,1),
  selected boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_quotations_project on quotations(project_id, qcps_total desc nulls last);

-- Config operacional (cap de projetos, etc.)
create table if not exists operational_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into operational_config (key, value)
values ('project_cap_quarter', '{"max": 12, "label": "Cap trimestral Estlar"}')
on conflict (key) do nothing;

-- RLS
alter table welcome_kits enable row level security;
alter table weekly_reports enable row level security;
alter table project_diary_entries enable row level security;
alter table scope_amendments enable row level security;
alter table quotations enable row level security;
alter table operational_config enable row level security;

drop policy if exists "gestor welcome_kits all" on welcome_kits;
create policy "gestor welcome_kits all" on welcome_kits
  for all using (current_user_role() = 'gestor');

drop policy if exists "cliente welcome_kits read" on welcome_kits;
create policy "cliente welcome_kits read" on welcome_kits
  for select using (
    current_user_role() = 'cliente'
    and project_id in (select p.id from projects p join profiles pr on pr.client_id = p.client_id where pr.id = auth.uid())
  );

drop policy if exists "gestor weekly_reports all" on weekly_reports;
create policy "gestor weekly_reports all" on weekly_reports
  for all using (current_user_role() = 'gestor');

drop policy if exists "cliente weekly_reports read sent" on weekly_reports;
create policy "cliente weekly_reports read sent" on weekly_reports
  for select using (
    status = 'sent'
    and current_user_role() = 'cliente'
    and project_id in (select p.id from projects p join profiles pr on pr.client_id = p.client_id where pr.id = auth.uid())
  );

drop policy if exists "gestor diary all" on project_diary_entries;
create policy "gestor diary all" on project_diary_entries
  for all using (current_user_role() = 'gestor');

drop policy if exists "gestor amendments all" on scope_amendments;
create policy "gestor amendments all" on scope_amendments
  for all using (current_user_role() = 'gestor');

drop policy if exists "gestor quotations all" on quotations;
create policy "gestor quotations all" on quotations
  for all using (current_user_role() = 'gestor');

drop policy if exists "gestor operational_config all" on operational_config;
create policy "gestor operational_config all" on operational_config
  for all using (current_user_role() = 'gestor');

-- Intake público: service role only (API route)
-- activity_events: novos tipos
alter table activity_events drop constraint if exists activity_events_entity_type_check;
alter table activity_events add constraint activity_events_entity_type_check
  check (entity_type in ('project','order','supplier','client','product','opportunity','weekly_report','quotation'));
