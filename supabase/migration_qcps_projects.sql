-- Migração para bancos já existentes (rodar no SQL Editor do Supabase)

-- QCPS em fornecedores
alter table suppliers add column if not exists score_q numeric(3,1) not null default 5.0;
alter table suppliers add column if not exists score_c numeric(3,1) not null default 5.0;
alter table suppliers add column if not exists score_p numeric(3,1) not null default 5.0;
alter table suppliers add column if not exists score_s numeric(3,1) not null default 5.0;

-- Se score era coluna normal, recriar como generated
alter table suppliers drop column if exists score;
alter table suppliers add column score numeric(3,1) generated always as ((score_q + score_c + score_p + score_s) / 4.0) stored;

-- Empreendimentos
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_id uuid references clients(id) on delete set null,
  location text,
  description text,
  phase text not null check (phase in ('A','B','C','D','E','F')) default 'A',
  status text not null check (status in ('active','paused','completed','cancelled')) default 'active',
  score_q numeric(3,1) not null default 5.0 check (score_q between 0 and 10),
  score_c numeric(3,1) not null default 5.0 check (score_c between 0 and 10),
  score_p numeric(3,1) not null default 5.0 check (score_p between 0 and 10),
  score_s numeric(3,1) not null default 5.0 check (score_s between 0 and 10),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders add column if not exists project_id uuid references projects(id) on delete set null;

create trigger projects_updated_at before update on projects for each row execute function update_updated_at();

alter table projects enable row level security;
create policy "allow all" on projects for all using (true);
