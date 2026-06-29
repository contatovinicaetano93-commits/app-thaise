-- Sprint 1 v2: fases customizadas da obra + progresso + portal do cliente

alter table projects
  add column if not exists progress_pct numeric(5,2) not null default 0
    check (progress_pct >= 0 and progress_pct <= 100),
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists current_phase_id uuid;

create table if not exists project_phases (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  weight_pct numeric(5,2) not null check (weight_pct > 0 and weight_pct <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_phases_project on project_phases(project_id, sort_order);

alter table projects
  drop constraint if exists projects_current_phase_id_fkey;

alter table projects
  add constraint projects_current_phase_id_fkey
  foreign key (current_phase_id) references project_phases(id) on delete set null;

create trigger project_phases_updated_at
  before update on project_phases
  for each row execute function update_updated_at();

alter table project_phases enable row level security;

create policy "gestor all project_phases" on project_phases for all
  using (current_user_role() = 'gestor');

create policy "cliente read project_phases" on project_phases for select
  using (
    current_user_role() = 'cliente'
    and exists (
      select 1 from projects p
      where p.id = project_phases.project_id
        and p.client_id = current_client_id()
        and p.portal_enabled = true
    )
  );

-- Fases padrão para obras existentes sem fases
insert into project_phases (project_id, name, sort_order, weight_pct)
select p.id, v.name, v.sort_order, v.weight_pct
from projects p
cross join (values
  ('Projeto', 0, 10),
  ('Obra cinza', 1, 30),
  ('Instalações', 2, 25),
  ('Acabamento', 3, 25),
  ('Entrega', 4, 10)
) as v(name, sort_order, weight_pct)
where not exists (select 1 from project_phases pp where pp.project_id = p.id);

update projects p
set current_phase_id = (
  select pp.id from project_phases pp
  where pp.project_id = p.id
  order by pp.sort_order asc
  limit 1
)
where p.current_phase_id is null
  and exists (select 1 from project_phases pp where pp.project_id = p.id);
