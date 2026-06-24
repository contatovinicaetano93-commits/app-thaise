-- PLATAFORMA THAISE - Schema

create extension if not exists "uuid-ossp";

-- Fornecedores (QCPS)
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  website text,
  score_q numeric(3,1) not null default 5.0 check (score_q between 0 and 10),
  score_c numeric(3,1) not null default 5.0 check (score_c between 0 and 10),
  score_p numeric(3,1) not null default 5.0 check (score_p between 0 and 10),
  score_s numeric(3,1) not null default 5.0 check (score_s between 0 and 10),
  score numeric(3,1) generated always as ((score_q + score_c + score_p + score_s) / 4.0) stored,
  status text check (status in ('active', 'inactive', 'pending')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clientes
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text not null,
  company text,
  segment text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Empreendimentos (Fases A–F + QCPS)
create table projects (
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

-- Produtos do catálogo (por fornecedor)
create table products (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references suppliers(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  price numeric(12,2) not null,
  unit text not null default 'un',
  min_order integer default 1,
  lead_time_days integer,
  active boolean default true,
  created_at timestamptz default now()
);

-- Pedidos
create table orders (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id),
  supplier_id uuid references suppliers(id),
  product_id uuid references products(id),
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) generated always as (quantity * unit_price) stored,
  status text check (status in ('pending','approved','processing','delivered','cancelled')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger suppliers_updated_at before update on suppliers for each row execute function update_updated_at();
create trigger clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders for each row execute function update_updated_at();

-- RLS
alter table suppliers enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

create policy "allow all" on suppliers for all using (true);
create policy "allow all" on clients for all using (true);
create policy "allow all" on projects for all using (true);
create policy "allow all" on products for all using (true);
create policy "allow all" on orders for all using (true);

-- ── Fase 2: Auth, Checklists, Filas, Agente ──

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('gestor','fornecedor','cliente')) default 'gestor',
  supplier_id uuid references suppliers(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now()
);

alter table projects add column checklist jsonb not null default '{}';

create table job_logs (
  id uuid primary key default uuid_generate_v4(),
  job_type text not null,
  payload jsonb not null default '{}',
  status text not null check (status in ('pending','processing','completed','failed')) default 'pending',
  result jsonb,
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table agent_insights (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('supplier','project')),
  entity_id uuid not null,
  insight text not null,
  scores jsonb,
  created_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'gestor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table job_logs enable row level security;
alter table agent_insights enable row level security;

create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "allow all job_logs" on job_logs for all using (true);
create policy "allow all agent_insights" on agent_insights for all using (true);

-- ── Resiliência + Memória ──

create table if not exists order_status_log (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

create table if not exists activity_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('project','order','supplier','client','product')),
  entity_id uuid not null,
  event_type text not null,
  title text not null,
  detail text,
  metadata jsonb default '{}',
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists processed_jobs (
  id uuid primary key default uuid_generate_v4(),
  job_key text not null unique,
  job_type text not null,
  order_id uuid references orders(id) on delete set null,
  result jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_activity_entity on activity_events(entity_type, entity_id, created_at desc);
create index if not exists idx_order_status_log_order on order_status_log(order_id, created_at desc);

alter table order_status_log enable row level security;
alter table activity_events enable row level security;
alter table processed_jobs enable row level security;

create policy "allow all order_status_log" on order_status_log for all using (true);
create policy "allow all activity_events" on activity_events for all using (true);
create policy "allow all processed_jobs" on processed_jobs for all using (true);

-- Webhooks + notificações
create table if not exists webhooks (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  events text[] not null default '{}',
  secret text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);

alter table webhooks enable row level security;
alter table notifications enable row level security;

create policy "allow all webhooks" on webhooks for all using (true);
create policy "notifications own" on notifications for all using (auth.uid() = user_id);

