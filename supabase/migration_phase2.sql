-- Migração Fase 2: Auth, Checklists, Filas, Agente AI

-- Perfis de usuário (roles)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('gestor','fornecedor','cliente')) default 'gestor',
  supplier_id uuid references suppliers(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now()
);

-- Checklist por fase no empreendimento
alter table projects add column if not exists checklist jsonb not null default '{}';

-- Log de jobs assíncronos (BullMQ / fallback inline)
create table if not exists job_logs (
  id uuid primary key default uuid_generate_v4(),
  job_type text not null,
  payload jsonb not null default '{}',
  status text not null check (status in ('pending','processing','completed','failed')) default 'pending',
  result jsonb,
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Insights do agente de scoring
create table if not exists agent_insights (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('supplier','project')),
  entity_id uuid not null,
  insight text not null,
  scores jsonb,
  created_at timestamptz default now()
);

-- Trigger: criar profile ao registrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'gestor')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS profiles
alter table profiles enable row level security;
create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);
create policy "gestor read all profiles" on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'gestor')
);

alter table job_logs enable row level security;
create policy "allow all job_logs" on job_logs for all using (true);

alter table agent_insights enable row level security;
create policy "allow all agent_insights" on agent_insights for all using (true);
